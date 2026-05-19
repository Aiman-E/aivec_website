import { useLanguage } from "@/lib/i18n";
import { useListSponsors, useCreateSponsor, useDeleteSponsor } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const sponsorSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  tier: z.enum(["platinum", "gold", "silver", "supporter", "government"]),
});

export function AdminSponsors() {
  const { lang, t } = useLanguage();
  const { data: sponsors, refetch } = useListSponsors();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createSponsor = useCreateSponsor();
  const deleteSponsor = useDeleteSponsor();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(sponsorSchema),
    defaultValues: { nameEn: "", nameAr: "", tier: "supporter" as any }
  });

  const onSubmit = (data: any) => {
    createSponsor.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Sponsor added" });
        setIsCreateOpen(false);
        form.reset();
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif">Sponsors</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button>Add Sponsor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Sponsor</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nameEn" render={({field}) => <FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>} />
                <FormField control={form.control} name="nameAr" render={({field}) => <FormItem><FormLabel>Name (AR)</FormLabel><FormControl><Input {...field} dir="rtl"/></FormControl></FormItem>} />
                <FormField control={form.control} name="tier" render={({field}) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="supporter">Supporter</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Tier</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {sponsors?.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.nameEn}</TableCell>
                <TableCell className="capitalize">{item.tier}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => {
                    if (confirm("Delete?")) deleteSponsor.mutate({id: item.id}, { onSuccess: () => refetch() });
                  }}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
