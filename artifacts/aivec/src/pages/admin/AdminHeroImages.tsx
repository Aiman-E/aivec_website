import {
  useListHeroImages,
  useCreateHeroImage,
  useUpdateHeroImage,
  useDeleteHeroImage,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const heroImageSchema = z.object({
  url: z.string().min(1, "URL is required"),
  captionEn: z.string().optional().default(""),
  captionAr: z.string().optional().default(""),
  order: z.coerce.number().int().optional().default(0),
});

type HeroImageFormValues = z.infer<typeof heroImageSchema>;

export function AdminHeroImages() {
  const { data: images, refetch } = useListHeroImages();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createImage = useCreateHeroImage();
  const updateImage = useUpdateHeroImage();
  const deleteImage = useDeleteHeroImage();
  const { toast } = useToast();

  const form = useForm<HeroImageFormValues>({
    resolver: zodResolver(heroImageSchema),
    defaultValues: { url: "", captionEn: "", captionAr: "", order: 0 },
  });

  const onSubmit = (data: HeroImageFormValues) => {
    createImage.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Hero image added" });
          setIsCreateOpen(false);
          form.reset();
          refetch();
        },
        onError: (err: any) => {
          toast({ title: "Failed to add", description: err?.message ?? "", variant: "destructive" });
        },
      }
    );
  };

  const toggleActive = (id: number, active: boolean) => {
    updateImage.mutate(
      { id, data: { active } },
      { onSuccess: () => refetch() }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">Hero Images</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Background slideshow on the landing page. Active images cycle every few seconds.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Add Image</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Hero Image</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/photo.jpg or /hero-anatomy.png"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="captionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption (EN, optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="captionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption (AR, optional)</FormLabel>
                      <FormControl>
                        <Input dir="rtl" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Save
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {images?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="w-24 h-16 bg-muted overflow-hidden border border-border">
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs max-w-md truncate">
                  {item.url}
                </TableCell>
                <TableCell>{item.order}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.active}
                    onCheckedChange={(v) => toggleActive(item.id, v)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this hero image?"))
                        deleteImage.mutate(
                          { id: item.id },
                          { onSuccess: () => refetch() }
                        );
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!images || images.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No hero images yet. The site will show the default anatomy illustration until you add some.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
