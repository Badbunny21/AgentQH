import React, { createContext, useContext, useState } from 'react';

export interface Task {
  id: string;
  title: string;
  agent: string;
  status: string;
  done: boolean;
  time: string;
}

interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const AppContext = createContext<AppContextType>({
  tasks: [],
  setTasks: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <AppContext.Provider value={{ tasks, setTasks }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
