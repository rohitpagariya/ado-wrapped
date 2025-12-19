import { AzureDevOpsClient } from "./client";
import { WorkItem, WorkItemQueryResult, WorkItemReference } from "./types";

export interface FetchWorkItemsOptions {
  project: string;
  year: number;
  userEmail?: string;
}

/**
 * Fetch work items that the user resolved/closed during the specified year.
 * All filtering is done server-side via WIQL query - no client-side filtering.
 *
 * Criteria:
 * - State is Resolved or Closed
 * - Reason does NOT contain "Rejected"
 * - AssignedTo matches the user email
 * - ResolvedDate or ClosedDate falls within the year
 */
export async function fetchWorkItems(
  client: AzureDevOpsClient,
  options: FetchWorkItemsOptions
): Promise<WorkItem[]> {
  const { project, year, userEmail } = options;

  console.log(`\n📋 fetchWorkItems: Starting for ${project}, year ${year}`);

  if (!userEmail) {
    console.log(`⚠️ No userEmail provided, skipping work items fetch`);
    return [];
  }

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Build WIQL query - all filtering happens server-side
  // We use EVER for AssignedTo to capture items assigned to user when resolved
  const wiqlQuery = buildWiqlQuery(project, userEmail, startDate, endDate);

  console.log(`🔍 Executing WIQL query for work items...`);

  try {
    // Step 1: Execute WIQL query to get work item IDs
    const queryResult = await client.post<WorkItemQueryResult>(
      `/${project}/_apis/wit/wiql`,
      { query: wiqlQuery }
    );

    const workItemRefs = queryResult.workItems || [];
    console.log(`📊 WIQL returned ${workItemRefs.length} work item IDs`);

    if (workItemRefs.length === 0) {
      return [];
    }

    // Step 2: Fetch full work item details in batches (API limit is 200 per request)
    const workItems = await fetchWorkItemDetails(client, project, workItemRefs);

    console.log(`✅ Fetched ${workItems.length} work items with details`);
    return workItems;
  } catch (error) {
    console.error(`❌ Error fetching work items:`, error);
    // Return empty array instead of failing - work items are optional
    return [];
  }
}

/**
 * Build WIQL query for fetching resolved/closed work items.
 * All filtering is done in the query - no client-side filtering needed.
 */
/**
 * Escape single quotes for WIQL query to prevent injection
 */
function escapeWiqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function buildWiqlQuery(
  project: string,
  userEmail: string,
  startDate: string,
  endDate: string
): string {
  // Escape user inputs to prevent WIQL injection
  const safeProject = escapeWiqlString(project);
  const safeUserEmail = escapeWiqlString(userEmail);

  // Note: We use EVER [System.AssignedTo] = to match items that were assigned
  // to the user at any point, which captures items resolved while assigned to them.
  // We filter on ChangedDate since ResolvedDate/ClosedDate may not exist in all process templates.
  // States vary by process: Agile uses Resolved/Closed, Scrum uses Done, Basic uses Done.
  // Note: WIQL with date precision doesn't allow time components, so we use date-only format.
  return `
    SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State],
           [System.Reason], [System.CreatedDate], [System.ChangedDate],
           [System.Tags], [System.AreaPath], [Microsoft.VSTS.Common.Priority],
           [Microsoft.VSTS.Common.Severity]
    FROM WorkItems
    WHERE [System.TeamProject] = '${safeProject}'
      AND [System.State] IN ('Resolved', 'Closed', 'Done', 'Completed')
      AND NOT [System.Reason] CONTAINS 'Rejected'
      AND EVER [System.AssignedTo] = '${safeUserEmail}'
      AND [System.ChangedDate] >= '${startDate}'
      AND [System.ChangedDate] <= '${endDate}'
    ORDER BY [System.ChangedDate] DESC
  `.trim();
}

/**
 * Fetch full work item details in batches.
 * Azure DevOps API limit is 200 IDs per request.
 */
async function fetchWorkItemDetails(
  client: AzureDevOpsClient,
  project: string,
  workItemRefs: WorkItemReference[]
): Promise<WorkItem[]> {
  const BATCH_SIZE = 200;
  const allWorkItems: WorkItem[] = [];

  // Fields we need for aggregation
  // Note: ResolvedDate/ClosedDate don't exist in all process templates, so we use ChangedDate
  const fields = [
    "System.Id",
    "System.WorkItemType",
    "System.Title",
    "System.State",
    "System.Reason",
    "System.CreatedDate",
    "System.ChangedDate",
    "System.Tags",
    "System.AreaPath",
    "Microsoft.VSTS.Common.Priority",
    "Microsoft.VSTS.Common.Severity",
  ].join(",");

  for (let i = 0; i < workItemRefs.length; i += BATCH_SIZE) {
    const batch = workItemRefs.slice(i, i + BATCH_SIZE);
    const ids = batch.map((ref) => ref.id).join(",");

    console.log(
      `📦 Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}: ${
        batch.length
      } items`
    );

    const response = await client.get<{ value: WorkItem[] }>(
      `/${project}/_apis/wit/workitems`,
      { ids, fields }
    );

    if (response.value) {
      allWorkItems.push(...response.value);
    }
  }

  return allWorkItems;
}
