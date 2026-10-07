import { Header } from "components/Header";
import { Footer } from "components/Footer";

export function ProfileLoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
      <Footer />
    </div>
  );
}
