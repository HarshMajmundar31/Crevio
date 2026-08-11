import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetNotifications, apiMarkNotificationAsRead, ApiNotification } from "@/lib/api";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiGetNotifications();
      return res.notifications || [];
    },
    // Poll every 30 seconds as fallback to sockets
    refetchInterval: 30000, 
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiMarkNotificationAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data || [];
  const unreadCount = notifications.filter((n: ApiNotification) => !n.is_read).length;

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-8 h-8 rounded-full">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal flex justify-between items-center">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {unreadCount} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notif: ApiNotification) => (
              <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3 gap-1 cursor-default">
                <div className="flex justify-between w-full items-start gap-2">
                  <span className={`text-sm font-medium ${notif.is_read ? 'text-muted-foreground' : ''}`}>
                    {notif.title}
                  </span>
                  {!notif.is_read && (
                    <button 
                      onClick={(e) => handleMarkAsRead(e, notif.id)}
                      className="text-[10px] text-primary hover:underline shrink-0"
                      disabled={markAsReadMutation.isPending}
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <span className={`text-xs ${notif.is_read ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                  {notif.message}
                </span>
                <span className="text-[10px] text-muted-foreground/40 mt-1">
                  {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
