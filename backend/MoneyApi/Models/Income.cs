namespace MoneyApi.Models;

public class Income
{
    public int Id { get; set; }
    public DateTime Date { get; set; }           // store date (UTC date-only)
    public decimal Amount { get; set; }          // decimal for money
    public string Source { get; set; } = "";     // e.g., Salary, Gift
}
