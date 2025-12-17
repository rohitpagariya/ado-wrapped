# Write Tests

Generate comprehensive tests for the specified code.

## Instructions

When writing tests for this project:

1. **Test framework** - Use Jest for JavaScript/TypeScript, pytest for Python
2. **Naming** - Use descriptive test names that explain expected behavior
3. **Structure** - Follow Arrange-Act-Assert (AAA) pattern
4. **Coverage** - Test happy paths, edge cases, and error conditions
5. **Mocking** - Mock external dependencies (APIs, databases)

## Jest Test Template

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { functionToTest } from './module';

// Mock external dependencies
jest.mock('./adoClient');

describe('functionToTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when given valid input', () => {
    it('should return expected result', async () => {
      // Arrange
      const input = { /* test data */ };
      const expected = { /* expected result */ };

      // Act
      const result = await functionToTest(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });

  describe('when given invalid input', () => {
    it('should throw an error', async () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      await expect(functionToTest(invalidInput)).rejects.toThrow('Invalid input');
    });
  });

  describe('when API call fails', () => {
    it('should handle error gracefully', async () => {
      // Arrange
      jest.mocked(apiClient.fetch).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await functionToTest({ id: '123' });

      // Assert
      expect(result.error).toBe('Unable to fetch data');
    });
  });
});
```

## React Component Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentToTest } from './ComponentToTest';

describe('ComponentToTest', () => {
  it('should render correctly', () => {
    render(<ComponentToTest prop="value" />);
    
    expect(screen.getByRole('heading')).toHaveTextContent('Expected Title');
  });

  it('should handle user interaction', async () => {
    const onClickMock = jest.fn();
    render(<ComponentToTest onClick={onClickMock} />);
    
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should display loading state', () => {
    render(<ComponentToTest isLoading={true} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<ComponentToTest error="Something went wrong" />);
    
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
```

## Python Test Template

```python
import pytest
from unittest.mock import Mock, patch
from module import function_to_test

class TestFunctionToTest:
    """Tests for function_to_test."""

    def test_returns_expected_result_with_valid_input(self):
        """Should return expected result when given valid input."""
        # Arrange
        input_data = {"key": "value"}
        expected = {"result": "success"}

        # Act
        result = function_to_test(input_data)

        # Assert
        assert result == expected

    def test_raises_error_with_invalid_input(self):
        """Should raise ValueError when given invalid input."""
        # Arrange
        invalid_input = None

        # Act & Assert
        with pytest.raises(ValueError, match="Invalid input"):
            function_to_test(invalid_input)

    @patch('module.external_api')
    def test_handles_api_error_gracefully(self, mock_api):
        """Should handle API errors gracefully."""
        # Arrange
        mock_api.fetch.side_effect = Exception("Network error")

        # Act
        result = function_to_test({"id": "123"})

        # Assert
        assert result["error"] == "Unable to fetch data"
```

## Checklist

- [ ] Happy path tested
- [ ] Edge cases covered
- [ ] Error conditions tested
- [ ] External dependencies mocked
- [ ] Async operations handled properly
- [ ] Test names are descriptive
