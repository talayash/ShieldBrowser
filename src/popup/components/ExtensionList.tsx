import type { MonitoredExtension } from "@/shared/types";
import ExtensionRow from "./ExtensionRow";

interface Props {
  extensions: MonitoredExtension[];
}

export default function ExtensionList({ extensions }: Props) {
  if (extensions.length === 0) {
    return (
      <p className="text-xs text-gray-500 py-4 text-center">
        No extensions detected yet
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-800">
      {extensions.map((ext) => (
        <ExtensionRow key={ext.id} ext={ext} />
      ))}
    </div>
  );
}
