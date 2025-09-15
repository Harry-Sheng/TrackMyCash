using Microsoft.EntityFrameworkCore;
using MoneyApi.Models;

namespace MoneyApi.Data;

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<Expense> Expenses => Set<Expense>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Income>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.Property(x => x.Source).HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Date);
        });

        b.Entity<Expense>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.Property(x => x.Category).HasMaxLength(100).IsRequired();
            e.Property(x => x.Description).HasMaxLength(200);
            e.HasIndex(x => x.Date);
            e.HasIndex(x => new { x.Date, x.Category });
        });
    }
}