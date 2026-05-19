import { useLanguage } from "@/lib/i18n";
import { useListBlog, useCreateBlog, useDeleteBlog, getListBlogQueryKey } from "@workspace/api-client-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

const blogSchema = z.object({
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  published: z.boolean().default(false),
});

export function AdminBlog() {
  const { lang, t } = useLanguage();
  const { data: posts } = useListBlog();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createBlog = useCreateBlog();
  const deleteBlog = useDeleteBlog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: { slug: "", titleEn: "", titleAr: "", published: false }
  });

  const onSubmit = (data: any) => {
    createBlog.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Post created" });
        setIsCreateOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListBlogQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif">Blog</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button>Add Post</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="slug" render={({field}) => <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>} />
                <FormField control={form.control} name="titleEn" render={({field}) => <FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>} />
                <FormField control={form.control} name="titleAr" render={({field}) => <FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} dir="rtl"/></FormControl></FormItem>} />
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {posts?.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.titleEn}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => {
                    if (confirm("Delete?")) deleteBlog.mutate({id: item.id}, { onSuccess: () => queryClient.invalidateQueries({queryKey: getListBlogQueryKey()})});
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
