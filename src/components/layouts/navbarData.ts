import {
  Settings2,
  SquareTerminal,
  LucideIcon,
  FileSpreadsheet,
  ScanSearch,
  Layers,
  ArrowLeftRight,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavItem[];
  roles?: string[]; // Roles that can access this item. If not specified, accessible to all
}

export interface NavbarData {
  navMain: NavItem[];
  projects: NavItem[];
}

export const navbarData: NavbarData = {
  navMain: [
    {
      title: "الرئيسية",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "استخراج بيانات Excel",
      url: "/excel-extractor",
      icon: FileSpreadsheet,
    },
    {
      title: "كشف التكرار",
      url: "/duplicate-detector",
      icon: ScanSearch,
    },
    {
      title: "دمج ملفات Excel",
      url: "/excel-merger",
      icon: Layers,
    },
    {
      title: "مقارنة ملفين Excel",
      url: "/excel-compare",
      icon: ArrowLeftRight,
    },
  ],
  projects: [
    {
      title: "ادارة المستخدمين",
      url: "/users",
      icon: Settings2,
      roles: ["admin"],
    },
  ],
};

// Utility function to filter navigation items based on user role
export function filterNavItemsByRole(items: NavItem[], userRole?: string): NavItem[] {
  if (!userRole) return []; // If no user role, return empty array
  
  return items
    .filter(item => {
      // If no roles specified, item is accessible to all authenticated users
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      // Check if user's role is in the allowed roles
      return item.roles.includes(userRole);
    })
    .map(item => ({
      ...item,
      // Recursively filter subitems if they exist
      items: item.items ? filterNavItemsByRole(item.items, userRole) : undefined
    }));
}

// Utility function to get filtered navbar data based on user role
export function getFilteredNavbarData(userRole?: string): NavbarData {
  return {
    navMain: filterNavItemsByRole(navbarData.navMain, userRole),
    projects: filterNavItemsByRole(navbarData.projects, userRole),
  };
}

// Utility function to generate route labels from navbar data
export function generateRouteLabels(data: NavbarData): Record<string, string> {
  const labels: Record<string, string> = {};
  
  // Helper function to extract labels from nav items
  const extractLabels = (items: NavItem[]) => {
    items.forEach(item => {
      labels[item.url] = item.title.trim();
      
      // If item has subitems, extract their labels too
      if (item.items) {
        extractLabels(item.items);
      }
    });
  };
  
  // Extract labels from both navMain and projects
  extractLabels(data.navMain);
  extractLabels(data.projects);
  
  return labels;
}