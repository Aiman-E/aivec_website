import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";

export interface BuilderFieldOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface BuilderField {
  fieldKey: string;
  fieldType: string;
  labelEn: string;
  labelAr: string;
  helpEn?: string;
  helpAr?: string;
  placeholderEn?: string;
  placeholderAr?: string;
  required?: boolean;
  order?: number;
  options?: BuilderFieldOption[] | null;
}

const FIELD_TYPES: Array<{ value: string; label: string }> = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown (single choice)" },
  { value: "radio", label: "Radio Buttons (single choice)" },
  { value: "checkbox", label: "Checkboxes (multiple choice)" },
  { value: "yes_no", label: "Yes / No toggle" },
  { value: "image_upload", label: "Image Upload" },
  { value: "file_upload", label: "File Upload (PDF/DOC)" },
  { value: "section_heading", label: "Section Heading" },
  { value: "description_text", label: "Description / Instructions" },
];

const TYPES_WITH_OPTIONS = new Set(["dropdown", "radio", "checkbox"]);
const TYPES_WITHOUT_INPUT = new Set(["section_heading", "description_text"]);
const TYPES_WITHOUT_PLACEHOLDER = new Set([
  "section_heading",
  "description_text",
  "yes_no",
  "image_upload",
  "file_upload",
  "date",
  "checkbox",
  "radio",
]);

interface FieldBuilderProps {
  fields: BuilderField[];
  onChange: (fields: BuilderField[]) => void;
}

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const updateField = (i: number, updates: Partial<BuilderField>) => {
    const next = [...fields];
    next[i] = { ...next[i], ...updates };
    onChange(next);
  };

  const removeField = (i: number) => onChange(fields.filter((_, idx) => idx !== i));

  const addOption = (fi: number) => {
    const field = fields[fi];
    const opts = [...(field.options || []), { value: `opt_${Date.now()}`, labelEn: "Option", labelAr: "خيار" }];
    updateField(fi, { options: opts });
  };

  const updateOption = (fi: number, oi: number, updates: Partial<BuilderFieldOption>) => {
    const field = fields[fi];
    if (!field.options) return;
    const opts = [...field.options];
    opts[oi] = { ...opts[oi], ...updates };
    updateField(fi, { options: opts });
  };

  const removeOption = (fi: number, oi: number) => {
    const field = fields[fi];
    if (!field.options) return;
    updateField(fi, { options: field.options.filter((_, i) => i !== oi) });
  };

  const moveField = (i: number, dir: "up" | "down") => {
    if (dir === "up" && i > 0) {
      const next = [...fields];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      onChange(next);
    } else if (dir === "down" && i < fields.length - 1) {
      const next = [...fields];
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      onChange(next);
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
        No fields added yet. Use "Add Field" above to start building your form.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field, i) => {
        const noInput = TYPES_WITHOUT_INPUT.has(field.fieldType);
        const hasOptions = TYPES_WITH_OPTIONS.has(field.fieldType);
        const hidePlaceholder = TYPES_WITHOUT_PLACEHOLDER.has(field.fieldType);
        return (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-4 py-3 bg-muted/30">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(i, "up")} disabled={i === 0}>↑</Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(i, "down")} disabled={i === fields.length - 1}>↓</Button>
              </div>
              <div className="flex-1 font-medium">
                Field {i + 1}: <span className="text-muted-foreground">{field.labelEn || "(no label)"}</span>{" "}
                <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">{field.fieldType}</span>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeField(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Field Key (unique identifier)</Label>
                  <Input
                    value={field.fieldKey}
                    onChange={(e) => updateField(i, { fieldKey: e.target.value })}
                    disabled={noInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={field.fieldType} onValueChange={(v) => updateField(i, { fieldType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!noInput && (
                  <div className="flex items-center gap-2 mt-6">
                    <Switch checked={!!field.required} onCheckedChange={(v) => updateField(i, { required: v })} />
                    <Label>Required Field</Label>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2"><Label>{noInput ? "Title (EN)" : "Label (EN)"}</Label><Input value={field.labelEn} onChange={(e) => updateField(i, { labelEn: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{noInput ? "Title (AR)" : "Label (AR)"}</Label><Input value={field.labelAr} onChange={(e) => updateField(i, { labelAr: e.target.value })} dir="rtl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2"><Label>{field.fieldType === "description_text" ? "Body (EN)" : "Help Text (EN)"}</Label><Input value={field.helpEn || ""} onChange={(e) => updateField(i, { helpEn: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{field.fieldType === "description_text" ? "Body (AR)" : "Help Text (AR)"}</Label><Input value={field.helpAr || ""} onChange={(e) => updateField(i, { helpAr: e.target.value })} dir="rtl" /></div>
                </div>
                {!hidePlaceholder && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2"><Label>Placeholder (EN)</Label><Input value={field.placeholderEn || ""} onChange={(e) => updateField(i, { placeholderEn: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Placeholder (AR)</Label><Input value={field.placeholderAr || ""} onChange={(e) => updateField(i, { placeholderAr: e.target.value })} dir="rtl" /></div>
                  </div>
                )}
              </div>

              {hasOptions && (
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base">Options</Label>
                    <Button size="sm" variant="outline" onClick={() => addOption(i)}><Plus className="w-3.5 h-3.5 mr-1" />Add Option</Button>
                  </div>
                  <div className="space-y-2">
                    {field.options?.map((opt, oi) => (
                      <div key={oi} className="flex gap-2 items-start">
                        <Input placeholder="Value (internal)" value={opt.value} onChange={(e) => updateOption(i, oi, { value: e.target.value })} className="w-1/4" />
                        <Input placeholder="Label (EN)" value={opt.labelEn} onChange={(e) => updateOption(i, oi, { labelEn: e.target.value })} className="w-1/3" />
                        <Input placeholder="Label (AR)" value={opt.labelAr} onChange={(e) => updateOption(i, oi, { labelAr: e.target.value })} className="w-1/3" dir="rtl" />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeOption(i, oi)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                    {(!field.options || field.options.length === 0) && (
                      <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded">No options added yet</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function makeNewField(order: number): BuilderField {
  return {
    fieldKey: `field_${Date.now()}`,
    fieldType: "short_text",
    labelEn: "New Field",
    labelAr: "حقل جديد",
    required: false,
    order,
    options: [],
  };
}
