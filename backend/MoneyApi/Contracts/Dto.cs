namespace MoneyApi;

public record IncomeCreateDto(string date, decimal amount, string source);
public record ExpenseCreateDto(string date, decimal amount, string category, string description);

public record IncomeDto(string id, decimal amount, string source, string date);
public record ExpenseDto(string id, decimal amount, string category, string description, string date);

public record ListResult<T>(IEnumerable<T> items);
public record SummaryDto(
    decimal totalIncome,
    decimal totalExpenses,
    decimal remainingBalance,
    decimal spentPercentage,
    IEnumerable<CategoryAmount> categoryBreakdown
);
public record CategoryAmount(string category, decimal amount);
