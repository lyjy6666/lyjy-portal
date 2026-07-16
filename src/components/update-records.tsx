'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UpdateRecord {
  version: string;
  date: string;
  content: string;
}

const updateRecords: UpdateRecord[] = [
  {
    version: 'v1.0',
    date: '2026.4.3',
    content: '番茄钟上线了',
  },
];

export function UpdateRecords() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none shadow-lg text-white z-40"
        >
          <Clock className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-red-500" />
            更新记录
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {updateRecords.map((record) => (
            <div
              key={record.version}
              className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {record.version}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {record.date}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {record.content}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
