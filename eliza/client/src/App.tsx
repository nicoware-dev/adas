import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import Chat from "./routes/chat";
import Overview from "./routes/overview";
import Home from "./routes/home";
import Landing from "./routes/landing";
import useVersion from "./hooks/use-version";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number.POSITIVE_INFINITY,
        },
    },
});

function App() {
    useVersion();
    return (
        <QueryClientProvider client={queryClient}>
            <div
                className="dark antialiased"
                style={{
                    colorScheme: "dark",
                }}
            >
                <BrowserRouter>
                    <TooltipProvider delayDuration={0}>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route
                                path="/*"
                                element={
                                    <SidebarProvider>
                                        <AppSidebar />
                                        <SidebarInset>
                                            <div className="flex flex-1 flex-col gap-4 size-full container">
                                                <Routes>
                                                    <Route path="/agents" element={<Home />} />
                                                    <Route
                                                        path="/chat/:agentId"
                                                        element={<Chat />}
                                                    />
                                                    <Route
                                                        path="/settings/:agentId"
                                                        element={<Overview />}
                                                    />
                                                    <Route path="*" element={<Navigate to="/agents" replace />} />
                                                </Routes>
                                            </div>
                                        </SidebarInset>
                                    </SidebarProvider>
                                }
                            />
                        </Routes>
                        <Toaster />
                    </TooltipProvider>
                </BrowserRouter>
            </div>
        </QueryClientProvider>
    );
}

export default App;
