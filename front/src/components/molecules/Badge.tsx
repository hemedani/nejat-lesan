
export const Badge = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">
      {children}
    </span>
  );
};
