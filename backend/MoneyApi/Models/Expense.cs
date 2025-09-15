namespace MoneyApi.Models;

public class Expense
{
    public int Id { get; set; }
    public DateTime Date { get; set; }               // date-only
    public decimal Amount { get; set; }
    public string Category { get; set; } = "";       // e.g., Food, Transport
    public string Description { get; set; } = "";    // e.g., Groceries
}
