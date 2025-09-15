// Program.cs (statements only)
using Microsoft.EntityFrameworkCore;
using MoneyApi.Data;
using MoneyApi.Models;
using MoneyApi.Contracts;

var builder = WebApplication.CreateBuilder(args);

// EF Core + SQLite
builder.Services.AddDbContext<AppDb>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// Swagger + CORS
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(policy => policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithOrigins(
            "http://localhost:3000",
            Environment.GetEnvironmentVariable("FRONTEND_ORIGIN") ?? "http://localhost:3000"
        ));
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// Validation helper
bool IsValidType(string t) => t is "Income" or "Expense";

// POST /api/tx
app.MapPost("/api/tx", async (CreateTxDto dto, AppDb db) =>
{
    if (!IsValidType(dto.Type)) return Results.BadRequest("Type must be 'Income' or 'Expense'");
    if (dto.Amount <= 0) return Results.BadRequest("Amount must be > 0");

    var tx = new TransactionEntry
    {
        OccurredOn = dto.OccurredOn.Date,
        Type = dto.Type,
        Amount = dto.Amount,
        Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description
    };
    db.Transactions.Add(tx);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tx/{tx.Id}", tx);
});

// GET /api/tx?year=&month=
app.MapGet("/api/tx", async (int? year, int? month, AppDb db) =>
{
    var now = DateTime.UtcNow;
    var y = year ?? now.Year;
    var m = month ?? now.Month;
    var start = new DateTime(y, m, 1);
    var end = start.AddMonths(1);

    var items = await db.Transactions
        .Where(t => t.OccurredOn >= start && t.OccurredOn < end)
        .OrderByDescending(t => t.OccurredOn).ThenByDescending(t => t.Id)
        .ToListAsync();

    return Results.Ok(new ListResult(items));
});

// GET /api/tx/summary?year=&month=
app.MapGet("/api/tx/summary", async (int? year, int? month, AppDb db) =>
{
    var now = DateTime.UtcNow;
    var y = year ?? now.Year;
    var m = month ?? now.Month;
    var start = new DateTime(y, m, 1);
    var end = start.AddMonths(1);

    var monthQuery = db.Transactions.Where(t => t.OccurredOn >= start && t.OccurredOn < end);

    var income = await monthQuery.Where(t => t.Type == "Income").SumAsync(t => (decimal?)t.Amount) ?? 0m;
    var expense = await monthQuery.Where(t => t.Type == "Expense").SumAsync(t => (decimal?)t.Amount) ?? 0m;
    var balance = income - expense;
    var spentPercent = income <= 0 ? 100m : Math.Min(100m, Math.Round((expense / income) * 100m, 0));

    return Results.Ok(new SummaryResult(income, expense, balance, spentPercent));
});

app.Run();
