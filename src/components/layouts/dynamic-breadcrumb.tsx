"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { navbarData, generateRouteLabels } from "./navbarData";

// Generate route labels from navbar data
const routeLabels = generateRouteLabels(navbarData)

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    // If we're on root path, show it
    if (pathname === "/") {
      breadcrumbs.push({
        href: "/",
        label: routeLabels["/"] || "لوحة التحكم",
        isLast: true,
      })
    } else {
      // Generate breadcrumbs for each path segment, starting from parent routes
      let currentPath = ""
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLast = index === pathSegments.length - 1

        // Get label from routeLabels or use segment as fallback
        const label = routeLabels[currentPath] || segment

        breadcrumbs.push({
          href: currentPath,
          label,
          isLast,
        })
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={breadcrumb.href}>
                  {breadcrumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!breadcrumb.isLast && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}