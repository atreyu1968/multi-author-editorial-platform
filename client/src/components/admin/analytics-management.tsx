import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Users, Activity, Clock, Mail, Download, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { AnalyticsDailyMetrics, Book, Author } from "@shared/schema";
import { useUiText } from "@/contexts/ui-text-context";

interface TopBook extends Book {
  totalPageviews: number;
}

interface TopAuthor extends Author {
  totalPageviews: number;
}

export default function AnalyticsManagement() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const t = {
    pageTitle: useUiText("admin.analytics", "page_title"),
    labelStartDate: useUiText("admin.analytics", "label_start_date"),
    labelEndDate: useUiText("admin.analytics", "label_end_date"),
    cardPageviews: useUiText("admin.analytics", "card_pageviews"),
    cardVisitors: useUiText("admin.analytics", "card_visitors"),
    cardSessions: useUiText("admin.analytics", "card_sessions"),
    cardDuration: useUiText("admin.analytics", "card_duration"),
    cardNewsletter: useUiText("admin.analytics", "card_newsletter"),
    cardDownloads: useUiText("admin.analytics", "card_downloads"),
    chartTitle: useUiText("admin.analytics", "chart_title"),
    emptyState: useUiText("admin.analytics", "empty_state"),
    tooltipPageviews: useUiText("admin.analytics", "tooltip_pageviews"),
    cardTopBooks: useUiText("admin.analytics", "card_top_books"),
    tableHeaderCover: useUiText("admin.analytics", "table_header_cover"),
    tableHeaderTitle: useUiText("admin.analytics", "table_header_title"),
    tableHeaderViews: useUiText("admin.analytics", "table_header_views"),
    tableHeaderAuthor: useUiText("admin.analytics", "table_header_author"),
    cardTopAuthors: useUiText("admin.analytics", "card_top_authors"),
    tableHeaderLogo: useUiText("admin.analytics", "table_header_logo"),
    tableHeaderName: useUiText("admin.analytics", "table_header_name"),
  };

  const dateRangeParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (startDate) {
      params.startDate = format(startDate, "yyyy-MM-dd");
    }
    if (endDate) {
      params.endDate = format(endDate, "yyyy-MM-dd");
    }
    return params;
  }, [startDate, endDate]);

  // Fetch metrics for summary and chart
  const { data: metrics = [], isLoading: metricsLoading } = useQuery<AnalyticsDailyMetrics[]>({
    queryKey: ["/api/analytics/metrics", dateRangeParams],
  });

  // Fetch top books
  const { data: topBooks = [], isLoading: booksLoading } = useQuery<TopBook[]>({
    queryKey: ["/api/analytics/top-books", { ...dateRangeParams, limit: 10 }],
  });

  // Fetch top authors
  const { data: topAuthors = [], isLoading: authorsLoading } = useQuery<TopAuthor[]>({
    queryKey: ["/api/analytics/top-authors", { ...dateRangeParams, limit: 10 }],
  });

  // Calculate summary metrics (global metrics only)
  const summaryMetrics = useMemo(() => {
    const globalMetrics = metrics.filter(m => !m.entityType || m.entityType === null);
    
    if (globalMetrics.length === 0) {
      return {
        totalPageviews: 0,
        uniqueVisitors: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        newsletterSignups: 0,
        bookDownloads: 0,
      };
    }

    return {
      totalPageviews: globalMetrics.reduce((sum, m) => sum + (m.totalPageviews || 0), 0),
      uniqueVisitors: globalMetrics.reduce((sum, m) => sum + (m.uniqueVisitors || 0), 0),
      totalSessions: globalMetrics.reduce((sum, m) => sum + (m.totalSessions || 0), 0),
      avgSessionDuration: globalMetrics.reduce((sum, m) => sum + (m.avgSessionDuration || 0), 0) / globalMetrics.length,
      newsletterSignups: globalMetrics.reduce((sum, m) => sum + (m.newsletterSignups || 0), 0),
      bookDownloads: globalMetrics.reduce((sum, m) => sum + (m.bookDownloads || 0), 0),
    };
  }, [metrics]);

  // Prepare chart data (global pageviews by day)
  const chartData = useMemo(() => {
    const globalMetrics = metrics.filter(m => !m.entityType || m.entityType === null);
    return globalMetrics.map(m => ({
      date: m.date,
      pageviews: m.totalPageviews || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(Math.round(num));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-bold text-primary" data-testid="title-analytics">{t.pageTitle}</h3>
        
        {/* Date Range Filters */}
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                data-testid="button-start-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: es }) : t.labelStartDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                data-testid="calendar-start-date"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                data-testid="button-end-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: es }) : t.labelEndDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                data-testid="calendar-end-date"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card data-testid="card-pageviews">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cardPageviews}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="value-pageviews">
                {formatNumber(summaryMetrics.totalPageviews)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-visitors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cardVisitors}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="value-visitors">
                {formatNumber(summaryMetrics.uniqueVisitors)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-sessions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cardSessions}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="value-sessions">
                {formatNumber(summaryMetrics.totalSessions)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-duration">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cardDuration}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="value-duration">
                {formatDuration(summaryMetrics.avgSessionDuration)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-newsletter">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cardNewsletter}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="value-newsletter">
                {formatNumber(summaryMetrics.newsletterSignups)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-downloads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cardDownloads}</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="value-downloads">
                {formatNumber(summaryMetrics.bookDownloads)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pageviews Trend Chart */}
      <Card data-testid="card-chart">
        <CardHeader>
          <CardTitle>{t.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t.emptyState}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "dd/MM", { locale: es })}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date as string), "PPP", { locale: es })}
                  formatter={(value: number) => [formatNumber(value), t.tooltipPageviews]}
                />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Books Table */}
      <Card data-testid="card-top-books">
        <CardHeader>
          <CardTitle>{t.cardTopBooks}</CardTitle>
        </CardHeader>
        <CardContent>
          {booksLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topBooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t.emptyState}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t.tableHeaderCover}</th>
                    <th className="text-left py-3 px-4">{t.tableHeaderTitle}</th>
                    <th className="text-left py-3 px-4">{t.tableHeaderViews}</th>
                    <th className="text-left py-3 px-4">{t.tableHeaderAuthor}</th>
                  </tr>
                </thead>
                <tbody>
                  {topBooks.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                      data-testid={`row-book-${book.id}`}
                    >
                      <td className="py-3 px-4">
                        <img
                          src={book.coverImage || "/placeholder.png"}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                          data-testid={`img-book-${book.id}`}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium" data-testid={`title-book-${book.id}`}>
                        {book.title}
                      </td>
                      <td className="py-3 px-4" data-testid={`views-book-${book.id}`}>
                        {formatNumber(book.totalPageviews)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground" data-testid={`author-book-${book.id}`}>
                        {book.authorId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Authors Table */}
      <Card data-testid="card-top-authors">
        <CardHeader>
          <CardTitle>{t.cardTopAuthors}</CardTitle>
        </CardHeader>
        <CardContent>
          {authorsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topAuthors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t.emptyState}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t.tableHeaderLogo}</th>
                    <th className="text-left py-3 px-4">{t.tableHeaderName}</th>
                    <th className="text-left py-3 px-4">{t.tableHeaderViews}</th>
                  </tr>
                </thead>
                <tbody>
                  {topAuthors.map((author) => (
                    <tr
                      key={author.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                      data-testid={`row-author-${author.id}`}
                    >
                      <td className="py-3 px-4">
                        <img
                          src={author.photo || "/placeholder.png"}
                          alt={author.name}
                          className="w-10 h-10 object-cover rounded-full"
                          data-testid={`img-author-${author.id}`}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium" data-testid={`name-author-${author.id}`}>
                        {author.name}
                      </td>
                      <td className="py-3 px-4" data-testid={`views-author-${author.id}`}>
                        {formatNumber(author.totalPageviews)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
