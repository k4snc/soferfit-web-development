import { Icon } from "./Icon";

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="member-empty"><span><Icon name="spark" /></span><h3>{title}</h3><p>{copy}</p></div>;
}
