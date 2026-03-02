/**
 * Bot Argument Dataset
 * ─────────────────────────────────────────────────────────────────────────────
 * Canned arguments for the AI bot opponent in Solo Practice Mode.
 * Organized by topic category and stance (FOR / AGAINST).
 * The bot randomly picks from the list each turn, ensuring variety.
 *
 * TEACHING NOTE:
 * These are intentionally well-reasoned arguments so that:
 *   1. The AI scorer (HuggingFace) gives them real scores.
 *   2. The user gets genuine practice pushing back against solid points.
 *   3. Hiring managers see a realistic debate transcript, not lorem ipsum.
 */

type BotLibrary = Record<string, { FOR: string[]; AGAINST: string[] }>;

export const BOT_ARGUMENTS: BotLibrary = {

    Technology: {
        FOR: [
            "Technology accelerates human progress at an unprecedented pace — problems that once took generations to solve now take years. We owe our current quality of life to technological innovation.",
            "Artificial intelligence and automation are creating entirely new categories of jobs while solving complex problems in healthcare, climate science, and logistics simultaneously.",
            "Open-source software has democratized knowledge — a developer in Bangladesh can access the same tools as one in Silicon Valley. Technology is the greatest equalizer in human history.",
            "The internet has given every person with a smartphone access to the sum total of human knowledge. The educational implications of this are still unfolding.",
            "Technology's role in climate monitoring and clean energy cannot be overstated. Solar panel efficiency has improved 10x in 20 years — this is what systemic change looks like.",
            "Digital communication dissolved geographic barriers for collaboration. The COVID-19 vaccine was developed faster than any in history precisely because researchers could collaborate globally in real time.",
            "Every moral panic about new technology — printing press, electricity, the internet — has proven unfounded. Society has always adapted, and always emerged more capable.",
            "Technology extends human lifespan and reduces suffering. Modern medicine, surgical robots, and diagnostic AI are saving lives that would have been lost just a decade ago.",
        ],
        AGAINST: [
            "Social media algorithms are optimized for engagement, which means they preferentially surface outrage, polarization, and misinformation. This is demonstrably damaging to democratic societies.",
            "Automation is displacing workers faster than new industries can absorb them. The transition cost — measured in unemployment, family instability, and community erosion — is borne by the most vulnerable.",
            "Big tech companies have accumulated more economic and political power than most nation-states, with almost no democratic accountability. This concentration of power is a structural threat.",
            "Constant connectivity has produced an epidemic of anxiety, particularly in adolescents. The mental health data from the last decade is damning — and the technology companies knew.",
            "The digital divide means technology's benefits flow disproportionately to the already privileged. We are using 'innovation' as a justification for widening inequality.",
            "Every new device contains cobalt mined in the Democratic Republic of Congo under brutal conditions. Our demand for technology is underwritten by exploitation we simply choose not to see.",
            "Smart home devices, fitness trackers, and smartphones collectively surveil us more comprehensively than any authoritarian government could have imagined. We volunteered for this.",
            "The attention economy has commodified human focus. Our minds are the product, and the consequences for our capacity for deep thought and sustained attention are only becoming clear.",
        ],
    },

    Politics: {
        FOR: [
            "Democratic governance, despite its imperfections, has proven to be the most reliable system for preventing the worst abuses of state power. The alternatives — authoritarianism, technocracy — have far worse track records.",
            "Regulated free markets have lifted more people out of poverty in the last 200 years than any other economic system. The evidence from post-war Europe and East Asia is empirically clear.",
            "International institutions like the UN and WHO — flawed as they are — have successfully coordinated responses to pandemics, nuclear proliferation, and humanitarian crises that no single nation could address.",
            "Progressive taxation is not ideological — it is mathematically necessary. Concentrated wealth in the hands of a few suppresses economic velocity. Redistribution is a growth strategy.",
            "Civil rights legislation demonstrates that political will can overcome generations of injustice. The arc of history bends toward justice precisely because politics allows us to collectively choose our values.",
            "Federalism distributes power in a way that allows policy experimentation. When states have autonomy, differences in outcomes teach us what actually works — this is empirical governance.",
            "Universal healthcare reduces the overall cost of medical care through preventive treatment, reduces emergency room overcrowding, and decouples employment from health security.",
            "Immigration consistently enriches both the receiving and sending countries. The empirical data on immigrant entrepreneurship, innovation, and fiscal contribution is unambiguous.",
        ],
        AGAINST: [
            "Most contemporary political polarization is manufactured by media ecosystems that profit from conflict. The average voter's views are far more nuanced than the politicians they are forced to choose between.",
            "Regulatory capture — where the industries being regulated end up controlling the regulators — is not a bug in democratic systems; it is a predictable feature. The pharmaceutical and financial industries are the clearest examples.",
            "Political short-termism is structurally built into electoral cycles. Four-year election cycles make it nearly impossible to govern for genuinely long-term threats like climate change or pension sustainability.",
            "The concentration of lobbying power means most legislation in practice serves donor interests, not voter interests. Campaign finance is the real constitution that governs decision-making.",
            "Nation-state boundaries are colonial artifacts that continue to generate conflict. Our political maps reflect 19th century power dynamics, not the actual distribution of peoples, languages, or communities.",
            "The perception of political choice is often illusory — both major parties in most democracies share fundamental economic assumptions that go unquestioned and unchallengeable at the ballot box.",
            "Mass incarceration is a political failure of historic proportions. Decades of 'tough on crime' politics destroyed communities and cost trillions, while doing nothing to address the root causes of crime.",
            "Foreign policy is almost never democratically accountable. Wars are initiated, alliances are formed, and trade deals are signed without meaningful public deliberation.",
        ],
    },

    Philosophy: {
        FOR: [
            "Consciousness is almost certainly more than the sum of its physical parts. The 'hard problem' — why subjective experience exists at all — has not been solved by neuroscience, and may not be solvable by purely physical accounts.",
            "Utilitarianism, despite its edge cases, provides the most actionable ethical framework for policy decisions. Maximizing wellbeing across all sentient beings is a coherent and measurable goal.",
            "Free will, understood as the capacity to deliberate and act on reasons, is compatible with determinism. We do not need libertarian free will for moral responsibility to be meaningful.",
            "Moral realism is correct: some things genuinely are wrong, independent of what any culture believes. Torturing children for fun is not 'wrong from our cultural perspective' — it is simply wrong.",
            "Epistemological humility — the acknowledgment of the limits of individual knowledge — is not weakness. It is the prerequisite for genuine learning and the foundation of science.",
            "Personal identity over time is more fluid than common sense suggests. The 'you' of 20 years ago shares almost no atoms with you now. Our intuitions about continuous selfhood are a useful fiction.",
            "The experience machine thought experiment shows we value things beyond mere pleasure — authenticity, genuine connection, and reality itself. This undermines pure hedonism.",
            "Rawlsian justice — designing society from behind a 'veil of ignorance' — remains the most powerful argument for progressive social policy ever constructed.",
        ],
        AGAINST: [
            "Abstract philosophical thought experiments routinely ignore the actual complexity of human psychology and social context. The 'trolley problem' has generated thousands of papers and zero moral clarity.",
            "The concept of objective moral truth is a category error. Moral claims express preferences, not facts. Trying to establish morality as a branch of knowledge like physics leads to irresolvable confusion.",
            "Philosophy's consistent failure to reach conclusions that inform real-world practice suggests it may be entertainment for the intellectual class, not a genuine path to human flourishing.",
            "Consciousness may be entirely explicable through physical processes we do not yet fully understand. Claiming it requires something 'extra' is a god-of-the-gaps argument applied to neuroscience.",
            "The distinction between 'free' and 'determined' action collapses under scrutiny. In a deterministic universe, the feeling of deliberation is itself determined. Compatibilism is semantic sleight-of-hand.",
            "Most ethical frameworks, including utilitarianism, become monstrous when pushed to their logical conclusions. This suggests our ethical intuitions are primary, and theories are post-hoc rationalizations.",
            "The 'self' as a continuous, unified subject is a narrative we construct, not a metaphysical reality. Buddhist philosophy reached this conclusion centuries before Western cognitive science confirmed it.",
            "Plato's philosopher-king concept is the intellectual ancestor of every technocracy and authoritarian system that has claimed it knows better than the people what the people should want.",
        ],
    },

    Science: {
        FOR: [
            "The scientific method is humanity's most reliable tool for generating true beliefs about the physical world. Its track record — from germ theory to quantum mechanics — is unmatched by any other epistemology.",
            "CRISPR gene editing has the potential to eradicate inherited diseases that have caused incalculable human suffering for thousands of years. The ethical risks are real but manageable.",
            "Space exploration has generated technologies — from GPS to memory foam — that have transformed daily life on Earth. The returns on investment dwarf the costs.",
            "Vaccines have eradicated smallpox, nearly eradicated polio, and saved hundreds of millions of lives. They represent science at its most directly humanitarian.",
            "Climate science has reached a consensus so strong — 97% of publishing climate scientists — that denying it is no longer a scientific position but a political one.",
            "Nuclear power, properly implemented with modern safety standards, is one of the lowest-risk and lowest-carbon energy sources available. Its bad reputation is more myth than data.",
            "Peer review, despite its imperfections, is still the best available system for quality control in knowledge production. Its alternatives — expert authority, market validation — are far worse.",
            "The Human Genome Project, completed in 2003, set the stage for personalized medicine. Understanding the genetic basis of disease is transforming how we treat cancer, rare diseases, and mental illness.",
        ],
        AGAINST: [
            "The replication crisis in psychology, nutrition science, and biomedicine reveals that a large portion of published research findings are false. The publish-or-perish incentive structure is corrupting science at scale.",
            "Scientific institutions, historically, have been embedded in power structures that shaped what got researched, who got funded, and whose suffering was deemed worth studying. This legacy bias persists.",
            "Technology transfer from scientific discovery to equitable access is catastrophically slow. We have known for decades how to prevent most child deaths from infectious disease — children are still dying.",
            "The commodification of science through private research funding means the research agenda is shaped by profit potential, not human need. Rare diseases get less attention than life-style drugs.",
            "Science's scope is necessarily limited to the empirically measurable. The most important questions human beings face — meaning, value, justice — are outside its jurisdiction.",
            "Scientific 'consensus' has been wrong before in ways that caused enormous harm — from lobotomies to the suppression of continental drift theory. Consensus is evidence, not certainty.",
            "Algorithmic bias in AI systems is scientific knowledge applied to discriminatory ends. The neutral framing of 'machine learning' obscures deeply political choices embedded in the training data.",
            "Modern agriculture's scientific achievements — high-yield monocultures, chemical fertilizers — have fed billions but also degraded soil health, polluted waterways, and devastated biodiversity.",
        ],
    },

    Society: {
        FOR: [
            "Universal Basic Income would not reduce the will to work — evidence from pilot programs in Finland, Kenya, and Stockton, California consistently shows recipients continue working and experience improved wellbeing.",
            "Social trust — measured by how much people trust strangers and institutions — is the single best predictor of a society's prosperity, health outcomes, and political stability.",
            "Strong public institutions, including well-funded public education and healthcare, produce better aggregate outcomes for entire populations than privatized alternatives, even when considering cost.",
            "Community is not a sentimental value — it is a public health necessity. Loneliness has health effects equivalent to smoking 15 cigarettes a day. The decline of civic institutions is a medical crisis.",
            "Diverse societies, when managed without discrimination, consistently outperform less diverse ones in creativity, problem-solving, and economic growth. Diversity is a structural advantage.",
            "The welfare state is not charity — it is risk pooling. Every participant benefits from a system that prevents catastrophic individual outcomes from unemployment, illness, or disability.",
            "Urban density is more environmentally sustainable, more economically productive, and — contrary to perception — safer than suburban sprawl. Zoning reform is a climate and equity issue simultaneously.",
            "Reducing working hours, as demonstrated in multiple national trials, increases productivity, improves health, and reduces carbon emissions — without any reduction in economic output.",
        ],
        AGAINST: [
            "The decline of family and community institutions has driven loneliness, addiction, and a loss of meaning that no government program can replace. Social engineering cannot substitute for genuine belonging.",
            "Safety net programs, however well-intentioned, can create dependency traps — particularly when combined with benefit cliffs that punish marginal income gains. Reform matters as much as funding.",
            "Urban planning's history is largely a history of catastrophic overconfidence — from failed housing projects to highways that destroyed neighborhoods. Humility about intervention is warranted.",
            "Cancel culture and social conformity pressures are suppressing intellectual diversity. The range of thinkable thoughts in elite institutions has narrowed, not widened, in the last decade.",
            "Mass immigration, while economically beneficial in aggregate, creates concentrated displacement pressures in specific communities — particularly for low-wage workers — that redistributive policy rarely addresses.",
            "The welfare state in its current form is structurally unsustainable given demographic trends. Without reform, the promises made to current retirees cannot be honored to future generations.",
            "Screen time and social media have restructured how children socialize, with measurable negative effects on depth of friendship, conflict resolution skills, and tolerance for ambiguity.",
            "The modern university system is pricing itself out of its own social function. Student debt has become a mechanism for transferring wealth from young people to institutional endowments.",
        ],
    },

    Ethics: {
        FOR: [
            "The obligation to reduce extreme suffering — including that of animals — wherever we can do so at reasonable cost is one of the most defensible ethical conclusions available to us.",
            "Effective altruism's core insight — that we should try to do the most good we can with our limited resources — is not radical. It is just taking moral consistency seriously.",
            "Intergenerational ethics demands that we weigh the interests of future persons in our policy decisions. Their inability to vote does not reduce the moral weight of their interests.",
            "Restorative justice, compared to purely punitive systems, produces better outcomes for victims, lower recidivism in offenders, and lower social cost. Ethics and effectiveness are aligned here.",
            "The moral circle has historically expanded — from tribe to nation to all humans. There are strong reasons to believe the ongoing expansion to include sentient animals is the next step.",
            "Whistleblowing is a moral obligation when institutions are causing harm that internal mechanisms cannot correct. The ethics of loyalty to institutions must yield to broader obligations.",
            "Informed consent is not merely a legal formality — it is the expression of a fundamental ethical principle: that persons must not be instrumentalized without their agreement.",
            "Moral progress is real. Slavery, once legally and philosophically justified by major thinkers, is now universally condemned. This shows that moral reasoning can genuinely change collective behavior.",
        ],
        AGAINST: [
            "Ethical frameworks designed in seminar rooms have a poor track record when applied to complex social realities. The unintended consequences of 'ethical' interventions often cause more harm than the original problem.",
            "The demand for ethical purity in personal consumer choices puts the burden of systemic problems on individuals, which is precisely where corporations and governments want it to be.",
            "Effective altruism, taken seriously, demands so much that it alienates people from moral engagement entirely. An ethics that demands sainthood creates a society of cynics.",
            "The expansion of rights discourse has outrun the philosophical underpinning that once gave rights their force. When everything is a right, the concept loses its ability to resolve genuine conflicts.",
            "Nature does not contain moral facts — only dispositions that evolution selected for because they improved reproductive fitness. Morality is a very sophisticated social technology, not a discovery.",
            "Most 'ethical' investment and consumer behavior is performative signaling that changes nothing structurally. The feel-good substitutes for the hard work of political organizing.",
            "The ethics of care — emphasizing relationships and context over abstract principles — reveals that universalist moral theories consistently undervalue the particular obligations we have to those close to us.",
            "Corporate 'ethical AI' initiatives are largely public relations. The same companies publishing ethics guidelines are simultaneously deploying systems that surveil workers, discriminate in lending, and amplify misinformation.",
        ],
    },
};

/**
 * Returns a random canned argument for a given category and side.
 * Falls back to Technology category if the category is unrecognized.
 */
export function pickBotArgument(category: string, side: "FOR" | "AGAINST"): string {
    const lib = BOT_ARGUMENTS[category] ?? BOT_ARGUMENTS["Technology"];
    const pool = lib[side];
    return pool[Math.floor(Math.random() * pool.length)];
}
