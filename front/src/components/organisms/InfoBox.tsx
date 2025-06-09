type CardProps = {
  title: string;
  value: number | string;
  description: string;
  bgColor?: string; // رنگ پس‌زمینه عدد
};

export const StatCard: React.FC<CardProps> = ({
  title,
  value,
  description,
  bgColor = "bg-blue-500",
}) => {
  return (
    <div className="flex justify-between w-full items-center border bg-white shadow-lg rounded-lg p-4">
      <div className="ml-4 text-right">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div
        className={`w-16 h-16 flex items-center justify-center rounded-lg ${bgColor}`}
      >
        <span className="text-white text-xl font-bold">{value}</span>
      </div>
    </div>
  );
};
