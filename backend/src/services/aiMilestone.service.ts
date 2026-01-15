import OpenAI from "openai";

const MILESTONES = new Set([1,3,7,14,21]as const);

type MilestoneDay= 1|3|7|14|21;

export type AIPayload = {
    milestoneDay: MilestoneDay,
    message: string
}

function isMilestoneDay(day: number): day is MilestoneDay {
    return MILESTONES.has(day as MilestoneDay);
}

function getOpenAIClient(){
    const openAiApiKey = process.env.OPEN_AI_API_KEY;
    if(!openAiApiKey){
        return null;
    }

    return new OpenAI({apiKey: openAiApiKey});
}

 // return ai message only is streak is a milestone and currentStreak > lastMilestone
    export async function getMilestoneAIMessage(habit: string, currentStreak: number, lastMilestone: number): Promise<AIPayload | null>{
        if(!isMilestoneDay(currentStreak) || currentStreak <= lastMilestone){
            return null;
        }

        const openai = getOpenAIClient();
        if(!openai){
            return null;
        }

        const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
        const prompt = `User just hit day ${currentStreak} of habit "${habit}". Give a short punchy motivation message (max 18 words).`

        const resp = await openai.responses.create({
            model,
            input: prompt
        })
        const message = resp.output_text?.trim() || "Keep going, you're doing great!";

        return {
            milestoneDay: currentStreak,
            message
        }

    }