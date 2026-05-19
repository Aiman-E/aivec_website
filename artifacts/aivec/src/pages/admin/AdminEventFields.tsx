import { useLanguage } from "@/lib/i18n";
import { useRoute, Link } from "wouter";
import { useGetEvent, useSetEventFields } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventFieldInput, EventFieldOption } from "@workspace/api-client-react";

export function AdminEventFields() {
  const { lang, t } = useLanguage();
  const [match, params] = useRoute("/:lang/admin/events/:id/fields");
  const eventId = Number(params?.id);
  const { toast } = useToast();

  const { data: eventData, isLoading, refetch } = useGetEvent(eventId.toString(), {
    query: { enabled: !!eventId } as never
  });
  
  const setEventFields = useSetEventFields();

  const [fields, setFields] = useState<EventFieldInput[]>([]);
  const loadedForEventRef = useRef<number | null>(null);

  useEffect(() => {
    // Only hydrate local state once per event id so background refetches
    // don't wipe in-progress edits.
    if (eventData?.fields && loadedForEventRef.current !== eventId) {
      setFields(eventData.fields.map(f => ({
        fieldKey: f.fieldKey,
        fieldType: f.fieldType,
        labelEn: f.labelEn || "",
        labelAr: f.labelAr || "",
        helpEn: f.helpEn || "",
        helpAr: f.helpAr || "",
        placeholderEn: f.placeholderEn || "",
        placeholderAr: f.placeholderAr || "",
        required: !!f.required,
        order: f.order,
        options: f.options || []
      })));
      loadedForEventRef.current = eventId;
    }
  }, [eventData, eventId]);

  if (isLoading) return <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  if (!eventData) return <div className="text-muted-foreground">{t("Event not found", "الفعالية غير موجودة")}</div>;

  const addField = () => {
    setFields([...fields, {
      fieldKey: `field_${Date.now()}`,
      fieldType: "short_text",
      labelEn: "New Field",
      labelAr: "حقل جديد",
      required: false,
      order: fields.length,
      options: []
    }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<EventFieldInput>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const newOptions = [...(field.options || []), { value: `opt_${Date.now()}`, labelEn: "Option", labelAr: "خيار" }];
    updateField(fieldIndex, { options: newOptions });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: Partial<EventFieldOption>) => {
    const field = fields[fieldIndex];
    if (!field.options) return;
    const newOptions = [...field.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    updateField(fieldIndex, { options: newOptions });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options) return;
    updateField(fieldIndex, { options: field.options.filter((_, i) => i !== optionIndex) });
  };

  const handleSave = () => {
    // Reorder before saving
    const orderedFields = fields.map((f, i) => ({ ...f, order: i }));
    setEventFields.mutate({
      id: eventId,
      data: { fields: orderedFields }
    }, {
      onSuccess: () => {
        toast({ title: "Fields saved successfully" });
        refetch();
      },
      onError: () => toast({ variant: "destructive", title: "Failed to save fields" })
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  };

  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/${lang}/admin/events`} className="inline-flex items-center text-sm text-muted-foreground mb-4">
            <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {t("Back to Events", "العودة للفعاليات")}
          </Link>
          <h1 className="text-3xl font-serif">Form Builder: {eventData.event.titleEn}</h1>
        </div>
        <div className="space-x-2 rtl:space-x-reverse">
          <Button variant="outline" onClick={addField}><Plus className="w-4 h-4 mr-2" /> Add Field</Button>
          <Button onClick={handleSave} disabled={setEventFields.isPending}>
            {setEventFields.isPending ? "Saving..." : "Save Fields"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-4 py-3 bg-muted/30">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(i, 'up')} disabled={i === 0}>↑</Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(i, 'down')} disabled={i === fields.length - 1}>↓</Button>
              </div>
              <div className="flex-1 font-medium">Field {i + 1}: {field.labelEn}</div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeField(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Field Key (Unique identifier)</Label>
                  <Input value={field.fieldKey} onChange={e => updateField(i, { fieldKey: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={field.fieldType} onValueChange={(v: any) => updateField(i, { fieldType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short_text">Short Text</SelectItem>
                      <SelectItem value="long_text">Long Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="radio">Radio Buttons</SelectItem>
                      <SelectItem value="checkbox">Checkbox (Boolean)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Switch checked={field.required} onCheckedChange={v => updateField(i, { required: v })} />
                  <Label>Required Field</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2"><Label>Label (EN)</Label><Input value={field.labelEn} onChange={e => updateField(i, { labelEn: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Label (AR)</Label><Input value={field.labelAr} onChange={e => updateField(i, { labelAr: e.target.value })} dir="rtl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2"><Label>Help Text (EN)</Label><Input value={field.helpEn || ""} onChange={e => updateField(i, { helpEn: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Help Text (AR)</Label><Input value={field.helpAr || ""} onChange={e => updateField(i, { helpAr: e.target.value })} dir="rtl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2"><Label>Placeholder (EN)</Label><Input value={field.placeholderEn || ""} onChange={e => updateField(i, { placeholderEn: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Placeholder (AR)</Label><Input value={field.placeholderAr || ""} onChange={e => updateField(i, { placeholderAr: e.target.value })} dir="rtl" /></div>
                </div>
              </div>

              {(field.fieldType === 'dropdown' || field.fieldType === 'radio') && (
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base">Options</Label>
                    <Button size="sm" variant="outline" onClick={() => addOption(i)}>Add Option</Button>
                  </div>
                  <div className="space-y-2">
                    {field.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex gap-2 items-start">
                        <Input placeholder="Value (internal)" value={opt.value} onChange={e => updateOption(i, optIdx, { value: e.target.value })} className="w-1/4" />
                        <Input placeholder="Label (EN)" value={opt.labelEn} onChange={e => updateOption(i, optIdx, { labelEn: e.target.value })} className="w-1/3" />
                        <Input placeholder="Label (AR)" value={opt.labelAr} onChange={e => updateOption(i, optIdx, { labelAr: e.target.value })} className="w-1/3" dir="rtl" />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeOption(i, optIdx)}><Trash2 className="w-4 h-4" /></Button>
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
        ))}
        {fields.length === 0 && (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
            No fields added yet. Click "Add Field" to start building your registration form.
          </div>
        )}
      </div>
    </div>
  );
}
