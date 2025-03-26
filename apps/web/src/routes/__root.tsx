import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ContractProvider } from "@/providers/ContractProvider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="system">
      <ContractProvider>
        <>
          <Header />
          <Outlet />
          <Footer />
          <Toaster />
          <TanStackRouterDevtools />
        </>
      </ContractProvider>
    </ThemeProvider>
  ),
});
