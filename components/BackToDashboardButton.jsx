// components/BackToDashboardButton.jsx
import Link from "next/link";
import { Button } from "./ui/button";

export default function BackToDashboardButton() {
  return (
    
    <Link href="/home">
          <Button variant="outline">Dashboard</Button>
    </Link>
  );
}
