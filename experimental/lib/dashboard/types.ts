import { Epic, Story } from "@/lib/apiHelpers";

export type EpicWithStories = Epic & {
    stories: Story[];
};