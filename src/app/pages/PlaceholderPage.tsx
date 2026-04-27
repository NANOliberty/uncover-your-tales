interface PlaceholderPageProps {
  title: string;
  milestone: string;
  description: string;
  todos: string[];
}

export function PlaceholderPage({ title, milestone, description, todos }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {milestone}
      </span>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>

      <div className="mt-6 rounded-lg border bg-card p-5">
        <p className="text-sm font-medium">이 마일스톤에서 만들 것</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {todos.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-muted-foreground/60">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
