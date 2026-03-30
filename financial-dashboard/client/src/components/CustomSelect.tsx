import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  isMulti?: boolean;
  isSearchable?: boolean;
  maxHeight?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  isMulti = false,
  isSearchable = false,
  maxHeight = "max-h-56",
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>(
    isMulti && Array.isArray(value) ? value : value ? [value] : []
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = searchTerm
    ? options.filter(
        opt =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabels = options
    .filter(opt => selectedValues.includes(opt.value))
    .map(opt => opt.label);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, isSearchable]);

  const handleSelect = (optionValue: string | number) => {
    if (isMulti) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newValues);
      onChange(newValues as any);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleRemove = (optionValue: string | number) => {
    if (isMulti) {
      const newValues = selectedValues.filter(v => v !== optionValue);
      setSelectedValues(newValues);
      onChange(newValues as any);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative" ref={containerRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 rounded-xl border border-slate-200 text-left flex items-center justify-between",
            "transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
            disabled ? "bg-slate-50 cursor-not-allowed opacity-50" : "bg-white hover:border-slate-300",
            isOpen && "ring-2 ring-indigo-500/20 border-indigo-500"
          )}
        >
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {isMulti ? (
              selectedLabels.length > 0 ? (
                selectedLabels.slice(0, 2).map((label, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-medium"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">{placeholder}</span>
              )
            ) : (
              <span
                className={selectedOption ? "text-slate-900" : "text-slate-500"}
              >
                {selectedOption?.label || placeholder}
              </span>
            )}
            {isMulti && selectedLabels.length > 2 && (
              <span className="text-slate-500 text-sm">
                +{selectedLabels.length - 2} more
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform flex-shrink-0",
              isOpen && "transform rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
            {/* Search Input */}
            {isSearchable && (
              <div className="p-3 border-b border-slate-100">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Options List */}
            <div className={cn("overflow-y-auto", maxHeight)}>
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = isMulti
                    ? selectedValues.includes(option.value)
                    : value === option.value;

                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors text-sm border-b border-slate-50 last:border-0",
                        isSelected && "bg-indigo-50 border-l-4 border-l-indigo-500"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div
                            className={cn(
                              "font-medium",
                              isSelected ? "text-indigo-900" : "text-slate-900"
                            )}
                          >
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-slate-500">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Multi-select selected tags */}
            {isMulti && selectedLabels.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2">
                {selectedLabels.map((label, idx) => {
                  const selectedVal = options.find(
                    opt => opt.label === label
                  )?.value;
                  return (
                    <div
                      key={idx}
                      className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {label}
                      <button
                        onClick={() => handleRemove(selectedVal)}
                        className="hover:text-indigo-900 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
