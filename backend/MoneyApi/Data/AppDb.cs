using Microsoft.EntityFrameworkCore;
using MoneyApi.Models;

namespace MoneyApi.Data;

public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) {}

    public DbSet<TransactionEntry> Transactions => Set<TransactionEntry>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<TransactionEntry>(e =>
        {
            e.Property(x => x.Type).HasMaxLength(10).IsRequired();
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasIndex(x => x.OccurredOn);
            e.HasIndex(x => new { x.OccurredOn, x.Type });
        });
    }
}
