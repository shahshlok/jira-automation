import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EpicWithStories } from "@/lib/dashboard/types";

interface AIGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedEpic: EpicWithStories | null;
}

export const AIGenerationDialog = ({ open, onOpenChange, selectedEpic }: AIGenerationDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 w-15 h-15 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg p-2 [&_svg]:!w-8 [&_svg]:!h-8">
                    <Sparkles className="text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>AI Generation</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="tests" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tests">
                            Generate Tests
                        </TabsTrigger>
                        <TabsTrigger value="stories">
                            Generate Stories
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="tests" className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                Number of test ideas
                            </label>
                            <Input
                                type="number"
                                defaultValue="5"
                                className="mt-1"
                            />
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Generate Test Ideas
                        </Button>
                    </TabsContent>
                    <TabsContent value="stories" className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                Number of user stories
                            </label>
                            <Input
                                type="number"
                                defaultValue="3"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Target Epic
                            </label>
                            <Input
                                defaultValue={
                                    selectedEpic?.summary ||
                                    "Select an epic first"
                                }
                                className="mt-1"
                            />
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Generate User Stories
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};