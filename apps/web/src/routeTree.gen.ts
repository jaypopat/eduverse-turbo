/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as metaverseCampusIndexImport } from './routes/(metaverse)/campus/index'
import { Route as contractTeachIndexImport } from './routes/(contract)/teach/index'
import { Route as contractProfileIndexImport } from './routes/(contract)/profile/index'
import { Route as contractDashboardIndexImport } from './routes/(contract)/dashboard/index'
import { Route as contractCoursesIndexImport } from './routes/(contract)/courses/index'
import { Route as contractCertificatesIndexImport } from './routes/(contract)/certificates/index'
import { Route as contractCoursesCourseIdImport } from './routes/(contract)/courses/$courseId'
import { Route as contractTeachDashboardIndexImport } from './routes/(contract)/teach/dashboard/index'
import { Route as contractTeachCoursesCourseIdImport } from './routes/(contract)/teach/courses/$courseId'
import { Route as contractTeachCoursesCourseIdEditImport } from './routes/(contract)/teach/courses/$courseId.edit'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const metaverseCampusIndexRoute = metaverseCampusIndexImport.update({
  id: '/(metaverse)/campus/',
  path: '/campus/',
  getParentRoute: () => rootRoute,
} as any)

const contractTeachIndexRoute = contractTeachIndexImport.update({
  id: '/(contract)/teach/',
  path: '/teach/',
  getParentRoute: () => rootRoute,
} as any)

const contractProfileIndexRoute = contractProfileIndexImport.update({
  id: '/(contract)/profile/',
  path: '/profile/',
  getParentRoute: () => rootRoute,
} as any)

const contractDashboardIndexRoute = contractDashboardIndexImport.update({
  id: '/(contract)/dashboard/',
  path: '/dashboard/',
  getParentRoute: () => rootRoute,
} as any)

const contractCoursesIndexRoute = contractCoursesIndexImport.update({
  id: '/(contract)/courses/',
  path: '/courses/',
  getParentRoute: () => rootRoute,
} as any)

const contractCertificatesIndexRoute = contractCertificatesIndexImport.update({
  id: '/(contract)/certificates/',
  path: '/certificates/',
  getParentRoute: () => rootRoute,
} as any)

const contractCoursesCourseIdRoute = contractCoursesCourseIdImport.update({
  id: '/(contract)/courses/$courseId',
  path: '/courses/$courseId',
  getParentRoute: () => rootRoute,
} as any)

const contractTeachDashboardIndexRoute =
  contractTeachDashboardIndexImport.update({
    id: '/(contract)/teach/dashboard/',
    path: '/teach/dashboard/',
    getParentRoute: () => rootRoute,
  } as any)

const contractTeachCoursesCourseIdRoute =
  contractTeachCoursesCourseIdImport.update({
    id: '/(contract)/teach/courses/$courseId',
    path: '/teach/courses/$courseId',
    getParentRoute: () => rootRoute,
  } as any)

const contractTeachCoursesCourseIdEditRoute =
  contractTeachCoursesCourseIdEditImport.update({
    id: '/edit',
    path: '/edit',
    getParentRoute: () => contractTeachCoursesCourseIdRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/courses/$courseId': {
      id: '/(contract)/courses/$courseId'
      path: '/courses/$courseId'
      fullPath: '/courses/$courseId'
      preLoaderRoute: typeof contractCoursesCourseIdImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/certificates/': {
      id: '/(contract)/certificates/'
      path: '/certificates'
      fullPath: '/certificates'
      preLoaderRoute: typeof contractCertificatesIndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/courses/': {
      id: '/(contract)/courses/'
      path: '/courses'
      fullPath: '/courses'
      preLoaderRoute: typeof contractCoursesIndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/dashboard/': {
      id: '/(contract)/dashboard/'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof contractDashboardIndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/profile/': {
      id: '/(contract)/profile/'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof contractProfileIndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/teach/': {
      id: '/(contract)/teach/'
      path: '/teach'
      fullPath: '/teach'
      preLoaderRoute: typeof contractTeachIndexImport
      parentRoute: typeof rootRoute
    }
    '/(metaverse)/campus/': {
      id: '/(metaverse)/campus/'
      path: '/campus'
      fullPath: '/campus'
      preLoaderRoute: typeof metaverseCampusIndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/teach/courses/$courseId': {
      id: '/(contract)/teach/courses/$courseId'
      path: '/teach/courses/$courseId'
      fullPath: '/teach/courses/$courseId'
      preLoaderRoute: typeof contractTeachCoursesCourseIdImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/teach/dashboard/': {
      id: '/(contract)/teach/dashboard/'
      path: '/teach/dashboard'
      fullPath: '/teach/dashboard'
      preLoaderRoute: typeof contractTeachDashboardIndexImport
      parentRoute: typeof rootRoute
    }
    '/(contract)/teach/courses/$courseId/edit': {
      id: '/(contract)/teach/courses/$courseId/edit'
      path: '/edit'
      fullPath: '/teach/courses/$courseId/edit'
      preLoaderRoute: typeof contractTeachCoursesCourseIdEditImport
      parentRoute: typeof contractTeachCoursesCourseIdImport
    }
  }
}

// Create and export the route tree

interface contractTeachCoursesCourseIdRouteChildren {
  contractTeachCoursesCourseIdEditRoute: typeof contractTeachCoursesCourseIdEditRoute
}

const contractTeachCoursesCourseIdRouteChildren: contractTeachCoursesCourseIdRouteChildren =
  {
    contractTeachCoursesCourseIdEditRoute:
      contractTeachCoursesCourseIdEditRoute,
  }

const contractTeachCoursesCourseIdRouteWithChildren =
  contractTeachCoursesCourseIdRoute._addFileChildren(
    contractTeachCoursesCourseIdRouteChildren,
  )

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/courses/$courseId': typeof contractCoursesCourseIdRoute
  '/certificates': typeof contractCertificatesIndexRoute
  '/courses': typeof contractCoursesIndexRoute
  '/dashboard': typeof contractDashboardIndexRoute
  '/profile': typeof contractProfileIndexRoute
  '/teach': typeof contractTeachIndexRoute
  '/campus': typeof metaverseCampusIndexRoute
  '/teach/courses/$courseId': typeof contractTeachCoursesCourseIdRouteWithChildren
  '/teach/dashboard': typeof contractTeachDashboardIndexRoute
  '/teach/courses/$courseId/edit': typeof contractTeachCoursesCourseIdEditRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/courses/$courseId': typeof contractCoursesCourseIdRoute
  '/certificates': typeof contractCertificatesIndexRoute
  '/courses': typeof contractCoursesIndexRoute
  '/dashboard': typeof contractDashboardIndexRoute
  '/profile': typeof contractProfileIndexRoute
  '/teach': typeof contractTeachIndexRoute
  '/campus': typeof metaverseCampusIndexRoute
  '/teach/courses/$courseId': typeof contractTeachCoursesCourseIdRouteWithChildren
  '/teach/dashboard': typeof contractTeachDashboardIndexRoute
  '/teach/courses/$courseId/edit': typeof contractTeachCoursesCourseIdEditRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/(contract)/courses/$courseId': typeof contractCoursesCourseIdRoute
  '/(contract)/certificates/': typeof contractCertificatesIndexRoute
  '/(contract)/courses/': typeof contractCoursesIndexRoute
  '/(contract)/dashboard/': typeof contractDashboardIndexRoute
  '/(contract)/profile/': typeof contractProfileIndexRoute
  '/(contract)/teach/': typeof contractTeachIndexRoute
  '/(metaverse)/campus/': typeof metaverseCampusIndexRoute
  '/(contract)/teach/courses/$courseId': typeof contractTeachCoursesCourseIdRouteWithChildren
  '/(contract)/teach/dashboard/': typeof contractTeachDashboardIndexRoute
  '/(contract)/teach/courses/$courseId/edit': typeof contractTeachCoursesCourseIdEditRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/courses/$courseId'
    | '/certificates'
    | '/courses'
    | '/dashboard'
    | '/profile'
    | '/teach'
    | '/campus'
    | '/teach/courses/$courseId'
    | '/teach/dashboard'
    | '/teach/courses/$courseId/edit'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/courses/$courseId'
    | '/certificates'
    | '/courses'
    | '/dashboard'
    | '/profile'
    | '/teach'
    | '/campus'
    | '/teach/courses/$courseId'
    | '/teach/dashboard'
    | '/teach/courses/$courseId/edit'
  id:
    | '__root__'
    | '/'
    | '/(contract)/courses/$courseId'
    | '/(contract)/certificates/'
    | '/(contract)/courses/'
    | '/(contract)/dashboard/'
    | '/(contract)/profile/'
    | '/(contract)/teach/'
    | '/(metaverse)/campus/'
    | '/(contract)/teach/courses/$courseId'
    | '/(contract)/teach/dashboard/'
    | '/(contract)/teach/courses/$courseId/edit'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  contractCoursesCourseIdRoute: typeof contractCoursesCourseIdRoute
  contractCertificatesIndexRoute: typeof contractCertificatesIndexRoute
  contractCoursesIndexRoute: typeof contractCoursesIndexRoute
  contractDashboardIndexRoute: typeof contractDashboardIndexRoute
  contractProfileIndexRoute: typeof contractProfileIndexRoute
  contractTeachIndexRoute: typeof contractTeachIndexRoute
  metaverseCampusIndexRoute: typeof metaverseCampusIndexRoute
  contractTeachCoursesCourseIdRoute: typeof contractTeachCoursesCourseIdRouteWithChildren
  contractTeachDashboardIndexRoute: typeof contractTeachDashboardIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  contractCoursesCourseIdRoute: contractCoursesCourseIdRoute,
  contractCertificatesIndexRoute: contractCertificatesIndexRoute,
  contractCoursesIndexRoute: contractCoursesIndexRoute,
  contractDashboardIndexRoute: contractDashboardIndexRoute,
  contractProfileIndexRoute: contractProfileIndexRoute,
  contractTeachIndexRoute: contractTeachIndexRoute,
  metaverseCampusIndexRoute: metaverseCampusIndexRoute,
  contractTeachCoursesCourseIdRoute:
    contractTeachCoursesCourseIdRouteWithChildren,
  contractTeachDashboardIndexRoute: contractTeachDashboardIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/(contract)/courses/$courseId",
        "/(contract)/certificates/",
        "/(contract)/courses/",
        "/(contract)/dashboard/",
        "/(contract)/profile/",
        "/(contract)/teach/",
        "/(metaverse)/campus/",
        "/(contract)/teach/courses/$courseId",
        "/(contract)/teach/dashboard/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/(contract)/courses/$courseId": {
      "filePath": "(contract)/courses/$courseId.tsx"
    },
    "/(contract)/certificates/": {
      "filePath": "(contract)/certificates/index.tsx"
    },
    "/(contract)/courses/": {
      "filePath": "(contract)/courses/index.tsx"
    },
    "/(contract)/dashboard/": {
      "filePath": "(contract)/dashboard/index.tsx"
    },
    "/(contract)/profile/": {
      "filePath": "(contract)/profile/index.tsx"
    },
    "/(contract)/teach/": {
      "filePath": "(contract)/teach/index.tsx"
    },
    "/(metaverse)/campus/": {
      "filePath": "(metaverse)/campus/index.tsx"
    },
    "/(contract)/teach/courses/$courseId": {
      "filePath": "(contract)/teach/courses/$courseId.tsx",
      "children": [
        "/(contract)/teach/courses/$courseId/edit"
      ]
    },
    "/(contract)/teach/dashboard/": {
      "filePath": "(contract)/teach/dashboard/index.tsx"
    },
    "/(contract)/teach/courses/$courseId/edit": {
      "filePath": "(contract)/teach/courses/$courseId.edit.tsx",
      "parent": "/(contract)/teach/courses/$courseId"
    }
  }
}
ROUTE_MANIFEST_END */
