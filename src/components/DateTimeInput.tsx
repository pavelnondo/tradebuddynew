import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimeInputProps {
  date: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}

export function DateTimeInput({ date, onChange, disabled }: DateTimeInputProps) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  const [timeValue, setTimeValue] = React.useState(`${hours}:${minutes}`);

  React.useEffect(() => {
    // Update the time input when the date prop changes
    const newHours = date.getHours().toString().padStart(2, "0");
    const newMinutes = date.getMinutes().toString().padStart(2, "0");
    setTimeValue(`${newHours}:${newMinutes}`);
  }, [date]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value);
    
    const [hours, minutes] = e.target.value.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onChange(newDate);
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      // Keep the existing time
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      onChange(newDate);
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <div className="relative flex items-center">
        <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="pl-9"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
