using Microsoft.EntityFrameworkCore;
using MoneyApi;
using MoneyApi.Data;
using MoneyApi.Models;

var builder = WebApplication.CreateBuilder(args);

// EF Core + SQLite
builder.Services.AddDbContext<AppDb>(opt =>
   opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Swagger + CORS
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(p => p
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

// ---------- Helpers (local functions are fine in top-level files) ----------
static DateTime ParseIsoDate(string iso) =>
    DateTime.SpecifyKind(DateTime.Parse(iso), DateTimeKind.Utc).Date;

static string ToIsoDate(DateTime d) => d.ToString("yyyy-MM-dd");

// ---------- Mapping ----------
static IncomeDto MapIncome(Income i) =>
    new(i.Id.ToString(), i.Amount, i.Source, ToIsoDate(i.Date));

static ExpenseDto MapExpense(Expense e) =>
    new(e.Id.ToString(), e.Amount, e.Category, e.Description, ToIsoDate(e.Date));

// ---------- Endpoints ----------

// Add income
app.MapPost("/api/incomes", async (IncomeCreateDto dto, AppDb db) =>
{
    if (dto.amount <= 0) return Results.BadRequest("Amount must be > 0");
    if (string.IsNullOrWhiteSpace(dto.source)) return Results.BadRequest("Source is required");
    var inc = new Income { Date = ParseIsoDate(dto.date), Amount = dto.amount, Source = dto.source.Trim() };
    db.Incomes.Add(inc);
    await db.SaveChangesAsync();
    return Results.Created($"/api/incomes/{inc.Id}", MapIncome(inc));
});

// Add expense
app.MapPost("/api/expenses", async (ExpenseCreateDto dto, AppDb db) =>
{
    if (dto.amount <= 0) return Results.BadRequest("Amount must be > 0");
    if (string.IsNullOrWhiteSpace(dto.category)) return Results.BadRequest("Category is required");
    if (string.IsNullOrWhiteSpace(dto.description)) return Results.BadRequest("Description is required");

    var exp = new Expense
    {
        Date = ParseIsoDate(dto.date),
        Amount = dto.amount,
        Category = dto.category.Trim(),
        Description = dto.description.Trim()
    };
    db.Expenses.Add(exp);
    await db.SaveChangesAsync();
    return Results.Created($"/api/expenses/{exp.Id}", MapExpense(exp));
});

// List incomes for a month
app.MapGet("/api/incomes", async (int? year, int? month, AppDb db) =>
{
    var (start, end) = MonthRange(year, month);
    var items = await db.Incomes
        .Where(x => x.Date >= start && x.Date < end)
        .OrderByDescending(x => x.Date).ThenByDescending(x => x.Id)
        .ToListAsync();

    return Results.Ok(new ListResult<IncomeDto>(items.Select(MapIncome)));
});

// List expenses for a month
app.MapGet("/api/expenses", async (int? year, int? month, AppDb db) =>
{
    var (start, end) = MonthRange(year, month);
    var items = await db.Expenses
        .Where(x => x.Date >= start && x.Date < end)
        .OrderByDescending(x => x.Date).ThenByDescending(x => x.Id)
        .ToListAsync();

    return Results.Ok(new ListResult<ExpenseDto>(items.Select(MapExpense)));
});

// Summary for a month
app.MapGet("/api/summary", async (int? year, int? month, AppDb db) =>
{
    var (start, end) = MonthRange(year, month);

    var monthIncomes = db.Incomes.Where(x => x.Date >= start && x.Date < end);
    var monthExpenses = db.Expenses.Where(x => x.Date >= start && x.Date < end);

    var totalIncome = await monthIncomes.SumAsync(x => (decimal?)x.Amount) ?? 0m;
    var totalExpenses = await monthExpenses.SumAsync(x => (decimal?)x.Amount) ?? 0m;
    var remaining = totalIncome - totalExpenses;
    var spentPct = totalIncome <= 0 ? 0m : Math.Round((totalExpenses / totalIncome) * 100m, 1);

    var catGroups = await monthExpenses
        .GroupBy(e => e.Category)
        .Select(g => new CategoryAmount(g.Key, g.Sum(x => x.Amount)))
        .ToListAsync();

    return Results.Ok(new SummaryDto(totalIncome, totalExpenses, remaining, spentPct, catGroups));
});

// util
static (DateTime start, DateTime end) MonthRange(int? year, int? month)
{
    var today = DateTime.UtcNow; // already UTC
    var y = year ?? today.Year;
    var m = month ?? today.Month;

    // 👇 set Kind=Utc explicitly (Unspecified is what causes the error)
    var start = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
    var end   = start.AddMonths(1); // stays Utc

    return (start, end);
}

app.Run();
