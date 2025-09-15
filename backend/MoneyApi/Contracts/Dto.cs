// Contracts/Dtos.cs
namespace MoneyApi.Contracts;

public record CreateTxDto(DateTime OccurredOn, string Type, decimal Amount, string? Description);
public record ListResult(IEnumerable<MoneyApi.Models.TransactionEntry> Items);
public record SummaryResult(decimal Income, decimal Expense, decimal Balance, decimal SpentPercent);
