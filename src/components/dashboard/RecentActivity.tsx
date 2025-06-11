import { useEffect, useState } from "react";
import { Upload, Sparkles, LineChart } from "lucide-react";

// Type for activity items
interface ActivityItem {
  action: string;
  item: string;
  time: string;
}

const iconForAction = (action: string) => {
  if (action.includes("Thumbnail")) return <Upload className="h-4 w-4 text-[#00F0FF]" />;
  if (action.includes("Script")) return <Sparkles className="h-4 w-4 text-[#00F0FF]" />;
  return <LineChart className="h-4 w-4 text-[#00F0FF]" />;
};

export default function RecentActivity() {
  // You can replace this with real API data in the future
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      action: "Thumbnail Analyzed",
      item: "summer-vlog-thumbnail.jpg",
      time: "2 hours ago",
    },
    {
      action: "Script Generated",
      item: "How to Edit Videos Like a Pro",
      time: "1 day ago",
    },
    {
      action: "Keyword Research",
      item: "video editing tips",
      time: "3 days ago",
    },
  ]);

  useEffect(() => {
    // Example: fetch('/api/activity').then(res => res.json()).then(setActivities);
  }, []);

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-700 rounded-md">
              {iconForAction(activity.action)}
            </div>
            <div>
              <p className="font-medium text-white">{activity.action}</p>
              <p className="text-sm text-gray-400">{activity.item}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </div>
      ))}
    </div>
  );
}
