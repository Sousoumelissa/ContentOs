// Calcule les compteurs affiches dans les petits onglets de statut.
// La liste recue doit deja etre filtree par recherche/compte, mais pas par statut.
export function makeStatusCounts<T>(items: T[], getStatus: (item: T) => string, hiddenStatusNames = new Set<string>()) {
  const counts: Record<string, number> = { Tout: 0 };

  items.forEach((item) => {
    const status = getStatus(item) || "Sans statut";
    counts[status] = (counts[status] ?? 0) + 1;

    if (!hiddenStatusNames.has(status)) {
      counts.Tout += 1;
    }
  });

  return counts;
}
