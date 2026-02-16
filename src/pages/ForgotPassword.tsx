import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }

        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            setIsSuccess(true);
            toast.success("Reset link sent!");
        } catch (err: any) {
            toast.error(err.message || "Failed to send reset link");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md border-0 shadow-lg relative z-10">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="space-y-6">
                            <div className="bg-primary/10 p-4 rounded-lg flex items-center gap-3 text-primary">
                                <Mail className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">
                                    If an account exists for <strong>{email}</strong>, you will receive password reset instructions.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate("/login")}
                            >
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="trainer@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 pl-10"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
