import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, FileText, TrendingUp } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">דוחות</h1>
        <p className="text-muted-foreground mt-1">צפייה בדוחות ונתונים סטטיסטיים</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              דוח עסקאות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              צפייה בכל העסקאות לפי תקופה, אולם או בעל אירוע
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              דוח הכנסות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              סיכום הכנסות לפי חודשים ואולמות
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-warning" />
              דוח לידים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              מעקב אחר לידים וסטטוס המרה
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>בקרוב...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            עמוד הדוחות המלא יהיה זמין בקרוב. כאן תוכלו לצפות בנתונים מפורטים,
            גרפים וניתוחים סטטיסטיים על פעילות המערכת.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
