import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Sparkles, LineChart, Users } from "lucide-react";

const statsConfig = [
  {
    title: "Analyzed Thumbnails",
    key: "thumbnails",
    icon: <Upload className="h-5 w-5 text-[#00F0FF]" />,
  },
  {
    title: "Generated Scripts",
    key: "scripts",
    icon: <Sparkles className="h-5 w-5 text-[#00F0FF]" />,
  },
  {
    title: "Keyword Research",
    key: "keywords",
    icon: <LineChart className="h-5 w-5 text-[#00F0FF]" />,
  },
  {
    title: "Team Members",
    key: "members",
    icon: <Users className="h-5 w-5 text-[#00F0FF]" />,
  },
];

export default function DashboardStats() {
  // You can replace these initial values with real API data in the future
  const [stats, setStats] = useState({
    thumbnails: 24,
    scripts: 12,
    keywords: 36,
    members: 3,
  });

  useEffect(() => {
    // Example: fetch stats from API here and update state
    // fetch('/api/stats').then(res => res.json()).then(setStats);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {statsConfig.map((stat) => (
        <Card key={stat.key} className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white">
                  {stats[stat.key]}
                </p>
              </div>
              <div className="p-2 bg-gray-800 rounded-md">{stat.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
