namespace MoneyApi.Models;

public class TransactionEntry
{
    public int Id { get; set; }
    public DateTime OccurredOn { get; set; }
    public string Type { get; set; } = "Expense"; // Income or Expense
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}
