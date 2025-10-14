import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Author } from "@shared/schema";

interface AdminAuthorContextType {
  selectedAuthorId: string | null;
  setSelectedAuthorId: (id: string) => void;
  authors: Author[];
  isLoading: boolean;
}

const AdminAuthorContext = createContext<AdminAuthorContextType | undefined>(undefined);

export function AdminAuthorProvider({ children }: { children: ReactNode }) {
  const [selectedAuthorId, setSelectedAuthorIdState] = useState<string | null>(() => {
    return localStorage.getItem("selectedAuthorId");
  });

  const { data: authors = [], isLoading } = useQuery<Author[]>({
    queryKey: ["/api/authors"],
  });

  useEffect(() => {
    if (!isLoading && authors.length > 0) {
      const storedAuthorId = localStorage.getItem("selectedAuthorId");
      
      if (storedAuthorId && authors.some(a => a.id === storedAuthorId)) {
        setSelectedAuthorIdState(storedAuthorId);
      } else {
        const firstActiveAuthor = authors.find(a => a.isActive);
        if (firstActiveAuthor) {
          setSelectedAuthorIdState(firstActiveAuthor.id);
          localStorage.setItem("selectedAuthorId", firstActiveAuthor.id);
        } else if (authors[0]) {
          setSelectedAuthorIdState(authors[0].id);
          localStorage.setItem("selectedAuthorId", authors[0].id);
        }
      }
    }
  }, [authors, isLoading]);

  const setSelectedAuthorId = (id: string) => {
    setSelectedAuthorIdState(id);
    localStorage.setItem("selectedAuthorId", id);
  };

  return (
    <AdminAuthorContext.Provider
      value={{
        selectedAuthorId,
        setSelectedAuthorId,
        authors,
        isLoading,
      }}
    >
      {children}
    </AdminAuthorContext.Provider>
  );
}

export function useAdminAuthor() {
  const context = useContext(AdminAuthorContext);
  if (!context) {
    throw new Error("useAdminAuthor must be used within AdminAuthorProvider");
  }
  return context;
}
