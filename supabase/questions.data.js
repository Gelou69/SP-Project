// ============================================================
//  GRADE 10 SCIENCE - EVOLUTION QUIZ  |  100 questions
//  Used by scripts/build-seed.mjs to generate supabase/seed.sql
//  image values use diagram://<key> sentinels mapped to built-in
//  SVG diagrams in the React app (always render) or real URLs.
// ============================================================

export const TOPICS = [
  'Evidence of Evolution',
  'Fossil Evidence',
  'Homologous Structures',
  'Analogous Structures',
  'Vestigial Structures',
  'Phylogenetic Trees',
  'Cladograms',
  'Natural Selection',
  'Adaptation and Variation',
  'Common Ancestry',
]

export const levels = [
  { level_number: 1, title: 'Foundations of Evolution', description: 'Meet Darwin, fossils, and the basic evidence that life evolves.' },
  { level_number: 2, title: 'Fossils and Time', description: 'Explore how fossils and rock layers reveal the history of life.' },
  { level_number: 3, title: 'Anatomy Uncovered', description: 'Compare homologous, analogous, and vestigial structures.' },
  { level_number: 4, title: 'Evidence in DNA and Embryos', description: 'Molecular biology and embryos confirm evolutionary relationships.' },
  { level_number: 5, title: 'Natural Selection in Action', description: 'Watch how populations change when the environment selects traits.' },
  { level_number: 6, title: 'Trees of Life', description: 'Read phylogenetic trees to see who is related to whom.' },
  { level_number: 7, title: 'Cladograms and Classification', description: 'Analyze shared derived characters to build clades.' },
  { level_number: 8, title: 'Adaptation and Survival', description: 'Discover how organisms evolve to fit their environments.' },
  { level_number: 9, title: 'Evolution in the Modern World', description: 'From antibiotics to viruses, evolution happens right now.' },
  { level_number: 10, title: 'Master of Evolution', description: 'The final challenge: put all evolution ideas together.' },
]

export const questions = [
  // ------------------------------------------------------------------
  // LEVEL 1 - Foundations of Evolution
  // ------------------------------------------------------------------
  { level: 1, topic: 'Evidence of Evolution', difficulty: 'easy', image: 'diagram://dna',
    q: 'Which scientist is best known for the theory of evolution by natural selection?',
    a: 'Charles Darwin', b: 'Gregor Mendel', c: 'Louis Pasteur', d: 'Albert Einstein', correct: 'A' },

  { level: 1, topic: 'Fossil Evidence', difficulty: 'easy', image: 'diagram://fossil',
    q: 'Remains or traces of ancient organisms that are preserved in rock are called ___.',
    a: 'fossils', b: 'minerals', c: 'sediments', d: 'artifacts', correct: 'A' },

  { level: 1, topic: 'Homologous Structures', difficulty: 'easy', image: 'diagram://homologous',
    q: 'A human arm and a bat wing have similar bone arrangements even though they are used differently. These structures are called ___.',
    a: 'homologous structures', b: 'analogous structures', c: 'vestigial structures', d: 'recombinant structures', correct: 'A' },

  { level: 1, topic: 'Analogous Structures', difficulty: 'easy', image: 'diagram://analogous',
    q: 'The wings of a bird and the wings of an insect both help in flying but formed from different origins. They are ___.',
    a: 'analogous structures', b: 'homologous structures', c: 'vestigial structures', d: 'fossil structures', correct: 'A' },

  { level: 1, topic: 'Vestigial Structures', difficulty: 'easy', image: 'diagram://vestigial',
    q: 'Which of the following is a vestigial structure in modern humans?',
    a: 'The appendix', b: 'The heart', c: 'The lungs', d: 'The brain', correct: 'A' },

  { level: 1, topic: 'Phylogenetic Trees', difficulty: 'easy', image: 'diagram://tree',
    q: 'A branching diagram that shows the evolutionary relationships among species is called a ___.',
    a: 'phylogenetic tree', b: 'food web', c: 'bar graph', d: 'stopwatch', correct: 'A' },

  { level: 1, topic: 'Cladograms', difficulty: 'easy', image: 'diagram://cladogram',
    q: 'A diagram that shows evolutionary relationships based on shared derived characteristics is a ___.',
    a: 'cladogram', b: 'pie chart', c: 'mountain profile', d: 'weather map', correct: 'A' },

  { level: 1, topic: 'Natural Selection', difficulty: 'easy',
    q: 'Individuals that are best suited to their environment are more likely to survive and reproduce. This idea is known as ___.',
    a: 'natural selection', b: 'artificial breeding', c: 'spontaneous generation', d: 'plate tectonics', correct: 'A' },

  { level: 1, topic: 'Adaptation and Variation', difficulty: 'easy', image: 'diagram://beaks',
    q: 'Differences in traits among individuals of the same species are called ___.',
    a: 'variations', b: 'fossils', c: 'ecosystems', d: 'mutations only from environment', correct: 'A' },

  { level: 1, topic: 'Common Ancestry', difficulty: 'easy', image: 'diagram://dna',
    q: 'Two different species that both use the same DNA genetic code provide strong evidence that they ___.',
    a: 'share a common ancestor', b: 'evolved separately', c: 'have no relationship at all', d: 'are the exact same species', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 2 - Fossils and Time
  // ------------------------------------------------------------------
  { level: 2, topic: 'Evidence of Evolution', difficulty: 'medium', image: 'diagram://fossil',
    q: 'Fossils found in deeper, older rock layers are generally ___ than fossils found in younger rock layers above them.',
    a: 'older', b: 'younger', c: 'larger', d: 'more colorful', correct: 'A' },

  { level: 2, topic: 'Fossil Evidence', difficulty: 'easy', image: 'diagram://fossil',
    q: 'Fossils are most commonly preserved in which type of rock?',
    a: 'Sedimentary rock', b: 'Igneous rock', c: 'Metamorphic rock', d: 'Volcanic glass', correct: 'A' },

  { level: 2, topic: 'Fossil Evidence', difficulty: 'medium', image: 'diagram://fossil',
    q: 'What is an index fossil?',
    a: 'A fossil of an organism that lived for a short time over a wide area, used to date rock layers',
    b: 'A fossil that is always a dinosaur bone',
    c: 'A fossil found only in caves',
    d: 'A fossil that is artificially manufactured', correct: 'A' },

  { level: 2, topic: 'Homologous Structures', difficulty: 'medium', image: 'diagram://homologous',
    q: 'Which of the following vertebrate forelimbs share a similar basic bone pattern?',
    a: 'All of the above (human arm, whale flipper, bird wing, bat wing)',
    b: 'Only human arm and whale flipper',
    c: 'Only bird wing and bat wing',
    d: 'None of the above', correct: 'A' },

  { level: 2, topic: 'Analogous Structures', difficulty: 'medium', image: 'diagram://analogous',
    q: 'Which pair of structures are analogous to each other?',
    a: 'A bird wing and an insect wing',
    b: 'A human arm and a bat wing',
    c: 'A whale flipper and a human arm',
    d: 'A dog leg and a bird wing', correct: 'A' },

  { level: 2, topic: 'Vestigial Structures', difficulty: 'medium', image: 'diagram://vestigial',
    q: 'Whales have small hip bones that no longer support legs. These are examples of ___ structures.',
    a: 'vestigial', b: 'analogous', c: 'photosynthetic', d: 'artificial', correct: 'A' },

  { level: 2, topic: 'Phylogenetic Trees', difficulty: 'medium', image: 'diagram://tree',
    q: 'In a phylogenetic tree, the point where two branches meet (the node) represents ___.',
    a: 'a common ancestor', b: 'a dead end', c: 'an ecosystem', d: 'a mutation in one organism', correct: 'A' },

  { level: 2, topic: 'Natural Selection', difficulty: 'medium', image: 'diagram://peppered',
    q: 'During the Industrial Revolution, dark peppered moths survived better than light moths on soot-darkened trees. This is an example of ___.',
    a: 'natural selection', b: 'genetic engineering', c: 'spontaneous mutation only', d: 'artificial selection by farmers', correct: 'A' },

  { level: 2, topic: 'Adaptation and Variation', difficulty: 'medium',
    q: 'A polar bear has thick fur and a layer of blubber. These features that help it survive the cold are called ___.',
    a: 'adaptations', b: 'habitats', c: 'behaviors', d: 'tissues', correct: 'A' },

  { level: 2, topic: 'Common Ancestry', difficulty: 'medium', image: 'diagram://dna',
    q: 'Human and chimpanzee DNA are about 98% similar. This similarity is evidence of ___.',
    a: 'a shared common ancestor', b: 'identical genes', c: 'no relationship', d: 'humans evolving from chimpanzees', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 3 - Anatomy Uncovered
  // ------------------------------------------------------------------
  { level: 3, topic: 'Homologous Structures', difficulty: 'medium', image: 'diagram://homologous',
    q: 'Which pair of structures are homologous?',
    a: 'Human arm and bat wing',
    b: 'Bird wing and insect wing',
    c: 'Butterfly wing and bird wing',
    d: 'Shark fin and dolphin flipper (same body shape)', correct: 'A' },

  { level: 3, topic: 'Homologous Structures', difficulty: 'hard',
    q: 'What do homologous structures in two different species indicate?',
    a: 'They share a common ancestor that had that structure',
    b: 'They live in the same habitat',
    c: 'They are the same species',
    d: 'They evolved identical traits independently', correct: 'A' },

  { level: 3, topic: 'Analogous Structures', difficulty: 'medium', image: 'diagram://analogous',
    q: 'Why are human eyes and octopus eyes considered analogous structures?',
    a: 'They perform a similar function but evolved independently',
    b: 'They share the exact same evolutionary origin',
    c: 'They are both vestigial',
    d: 'They contain identical DNA', correct: 'A' },

  { level: 3, topic: 'Analogous Structures', difficulty: 'hard',
    q: 'Convergent evolution produces structures that are ___ between the two organisms.',
    a: 'analogous', b: 'homologous', c: 'vestigial', d: 'inherited from the same ancestor', correct: 'A' },

  { level: 3, topic: 'Vestigial Structures', difficulty: 'medium', image: 'diagram://vestigial',
    q: 'The human tailbone (coccyx) is considered vestigial because ___.',
    a: 'it no longer supports a functional tail',
    b: 'it produces red blood cells for the first time',
    c: 'it is the largest bone in the body',
    d: 'it only forms after death', correct: 'A' },

  { level: 3, topic: 'Vestigial Structures', difficulty: 'medium',
    q: 'Which structure in hind-limb snakes is considered vestigial?',
    a: 'Small pelvic bones', b: 'Their fangs', c: 'Their forked tongue', d: 'Their scales', correct: 'A' },

  { level: 3, topic: 'Fossil Evidence', difficulty: 'medium', image: 'diagram://archaeopteryx',
    q: 'Archaeopteryx is a famous transitional fossil because it has ___.',
    a: 'features of both reptiles and birds',
    b: 'only modern bird features',
    c: 'only dinosaur features',
    d: 'features of mammals and amphibians', correct: 'A' },

  { level: 3, topic: 'Natural Selection', difficulty: 'medium',
    q: 'What is the primary raw material that natural selection acts upon?',
    a: 'Genetic variation in a population',
    b: 'Rocks and minerals',
    c: 'Fossil fuel energy',
    d: 'The age of the organism', correct: 'A' },

  { level: 3, topic: 'Adaptation and Variation', difficulty: 'easy', image: 'diagram://camo',
    q: 'A chameleon changing color to blend in with its surroundings is an example of ___.',
    a: 'camouflage, an adaptation for survival',
    b: 'a vestigial behavior',
    c: 'an index fossil',
    d: 'reproductive isolation', correct: 'A' },

  { level: 3, topic: 'Common Ancestry', difficulty: 'hard', image: 'diagram://homologous',
    q: 'The similar arrangement of limb bones across very different vertebrates is best explained by ___.',
    a: 'shared ancestry', b: 'coincidence', c: 'identical habitats', d: 'artificial selection only', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 4 - Evidence in DNA and Embryos
  // ------------------------------------------------------------------
  { level: 4, topic: 'Evidence of Evolution', difficulty: 'medium', image: 'diagram://embryo',
    q: 'Embryos of very different vertebrates look similar during early development. This is evidence for ___.',
    a: 'common ancestry', b: 'independent creation', c: 'unrelated evolution', d: 'environmental change only', correct: 'A' },

  { level: 4, topic: 'Evidence of Evolution', difficulty: 'medium', image: 'diagram://dna',
    q: 'Comparing the same genes across different species to infer relatedness is called ___ evidence.',
    a: 'molecular (DNA)', b: 'fossil', c: 'anatomical', d: 'climatological', correct: 'A' },

  { level: 4, topic: 'Evidence of Evolution', difficulty: 'hard',
    q: 'Which of the following statements gives the LEAST support for the theory of evolution?',
    a: 'Each species was created independently with no shared traits',
    b: 'Vertebrate embryos look alike in early stages',
    c: 'DNA sequences are similar in closely related species',
    d: 'Transitional fossils like Archaeopteryx exist', correct: 'A' },

  { level: 4, topic: 'Fossil Evidence', difficulty: 'hard',
    q: 'Radiometric dating estimates the age of fossils by ___.',
    a: 'measuring the decay of radioactive isotopes',
    b: 'counting the number of bones',
    c: 'measuring fossil weight',
    d: 'checking the color of the rock', correct: 'A' },

  { level: 4, topic: 'Homologous Structures', difficulty: 'medium', image: 'diagram://homologous',
    q: 'A human hand and a whale flipper have similar bone number and arrangement. This supports the idea that they ___.',
    a: 'share a common ancestor',
    b: 'evolved identical traits from scratch',
    c: 'live in the same environment',
    d: 'are the same species', correct: 'A' },

  { level: 4, topic: 'Analogous Structures', difficulty: 'medium', image: 'diagram://analogous',
    q: 'Which pair of structures demonstrates analogous structures?',
    a: 'Wings of birds and wings of butterflies',
    b: 'Forelimbs of humans and bats',
    c: 'Flippers of whales and arms of humans',
    d: 'Legs of dogs and wings of bats', correct: 'A' },

  { level: 4, topic: 'Phylogenetic Trees', difficulty: 'medium', image: 'diagram://tree',
    q: 'On a phylogenetic tree, the species that shares the most recent common ancestor with humans is ___.',
    a: 'the chimpanzee', b: 'a mushroom', c: 'a sunflower', d: 'an amoeba', correct: 'A' },

  { level: 4, topic: 'Vestigial Structures', difficulty: 'hard', image: 'diagram://vestigial',
    q: 'The presence of vestigial structures such as the human appendix suggests that ___.',
    a: 'ancestors of humans had structures that were once functional',
    b: 'the appendix was placed by chance with no history',
    c: 'vestigial structures appear only in fossils',
    d: 'vestigial structures prove species do not change', correct: 'A' },

  { level: 4, topic: 'Natural Selection', difficulty: 'medium', image: 'diagram://natural-selection',
    q: 'Which of the following conditions are necessary for natural selection to occur?',
    a: 'Variation, heritability, and differential survival',
    b: 'Only variation is needed',
    c: 'Only survival without reproduction',
    d: 'Identical individuals with no variation', correct: 'A' },

  { level: 4, topic: 'Common Ancestry', difficulty: 'medium',
    q: 'All living organisms use the same genetic code (DNA makes RNA makes protein). This is evidence of ___.',
    a: 'a universal common ancestor', b: 'random creation', c: 'no relationship between species', d: 'separate origins', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 5 - Natural Selection in Action
  // ------------------------------------------------------------------
  { level: 5, topic: 'Natural Selection', difficulty: 'easy',
    q: 'Which of the following best describes natural selection?',
    a: 'Organisms with traits best suited to the environment are more likely to survive and reproduce',
    b: 'Organisms change their bodies during their lifetime because they want to',
    c: 'The environment selects organisms to change randomly',
    d: 'All organisms in a population survive equally', correct: 'A' },

  { level: 5, topic: 'Adaptation and Variation', difficulty: 'medium', image: 'diagram://beaks',
    q: 'Galapagos finches have different beak shapes suited to different foods. This is an example of ___.',
    a: 'adaptation through natural selection',
    b: 'a vestigial structure',
    c: 'an index fossil',
    d: 'plate tectonics', correct: 'A' },

  { level: 5, topic: 'Natural Selection', difficulty: 'medium', image: 'diagram://natural-selection',
    q: 'A beetle population has some green and some brown individuals on a brown tree trunk. Brown beetles are less visible to predators. Over many generations, what will likely happen?',
    a: 'Brown beetles will become more common',
    b: 'Green beetles will become more common',
    c: 'Both colors will disappear',
    d: 'Beetles will stop reproducing', correct: 'A' },

  { level: 5, topic: 'Natural Selection', difficulty: 'hard',
    q: 'Antibiotic resistance in bacteria is an example of natural selection because ___.',
    a: 'resistant bacteria survive antibiotics and reproduce, passing on the trait',
    b: 'bacteria choose to become resistant',
    c: 'antibiotics cause every bacterium to mutate at once',
    d: 'resistance has nothing to do with genes', correct: 'A' },

  { level: 5, topic: 'Natural Selection', difficulty: 'medium',
    q: 'A farmer uses the same pesticide for years until it stops killing insects. The insect resistance is a result of ___.',
    a: 'natural selection acting on pre-existing genetic variation',
    b: 'the pesticide creating new genes in every insect',
    c: 'insects exercising to become stronger',
    d: 'the insects changing their diet', correct: 'A' },

  { level: 5, topic: 'Adaptation and Variation', difficulty: 'medium', image: 'diagram://camo',
    q: 'When a moth looks exactly like a dead leaf, its appearance is a ___ adaptation.',
    a: 'camouflage', b: 'mimicry', c: 'vestigial', d: 'migration', correct: 'A' },

  { level: 5, topic: 'Adaptation and Variation', difficulty: 'medium', image: 'diagram://mimicry',
    q: 'A harmless scarlet kingsnake looks very similar to the venomous coral snake. This protection is called ___.',
    a: 'mimicry', b: 'photosynthesis', c: 'fossilization', d: 'metamorphosis', correct: 'A' },

  { level: 5, topic: 'Adaptation and Variation', difficulty: 'easy',
    q: 'What is the original source of new genetic variation in a population?',
    a: 'Mutations', b: 'Reproductive isolation between species', c: 'Fossil formation', d: 'Migration of rocks', correct: 'A' },

  { level: 5, topic: 'Phylogenetic Trees', difficulty: 'medium',
    q: 'The idea that evolution usually happens through the slow accumulation of many small changes is called ___.',
    a: 'gradualism', b: 'catastrophism', c: 'creationism', d: 'erosion', correct: 'A' },

  { level: 5, topic: 'Common Ancestry', difficulty: 'medium', image: 'diagram://dna',
    q: 'Similar amino-acid sequences in the protein hemoglobin across many species support the idea of ___.',
    a: 'common ancestry', b: 'independent origins', c: 'identical habitats', d: 'artificial selection only', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 6 - Trees of Life
  // ------------------------------------------------------------------
  { level: 6, topic: 'Phylogenetic Trees', difficulty: 'easy', image: 'diagram://tree',
    q: 'On a phylogenetic tree, branches represent ___.',
    a: 'evolutionary lineages over time', b: 'food chains', c: 'weather patterns', d: 'layers of rock', correct: 'A' },

  { level: 6, topic: 'Phylogenetic Trees', difficulty: 'medium', image: 'diagram://tree',
    q: 'The tips (endpoints) of a phylogenetic tree represent ___.',
    a: 'present-day species or groups', b: 'only extinct species', c: 'only fossils', d: 'single organisms, not species', correct: 'A' },

  { level: 6, topic: 'Phylogenetic Trees', difficulty: 'hard', image: 'diagram://tree',
    q: 'The length of a branch on a phylogenetic tree usually represents ___.',
    a: 'the amount of evolutionary change or time',
    b: 'the body size of the organism',
    c: 'the number of legs',
    d: 'the color of the organism', correct: 'A' },

  { level: 6, topic: 'Cladograms', difficulty: 'easy', image: 'diagram://cladogram',
    q: 'In a cladogram, the point where two branches split represents ___.',
    a: 'a common ancestor', b: 'a present-day species only', c: 'an extinct ecosystem', d: 'a food chain', correct: 'A' },

  { level: 6, topic: 'Cladograms', difficulty: 'medium', image: 'diagram://cladogram',
    q: 'Which two taxa in a cladogram are most closely related to each other?',
    a: 'The pair that shares the most derived characters (traits) together',
    b: 'The pair at opposite ends of the diagram',
    c: 'The pair that looks the most beautiful',
    d: 'The pair with the most different DNA', correct: 'A' },

  { level: 6, topic: 'Cladograms', difficulty: 'medium', image: 'diagram://cladogram',
    q: 'The outgroup in a cladogram is the taxon that ___.',
    a: 'branches off earliest and shares fewest derived characters',
    b: 'shares the most traits with all others',
    c: 'is always at the top of the diagram',
    d: 'is a modern species', correct: 'A' },

  { level: 6, topic: 'Cladograms', difficulty: 'hard',
    q: 'A group that includes a common ancestor and ALL of its descendants is called a ___.',
    a: 'clade (monophyletic group)', b: 'polyphyletic group', c: 'food chain', d: 'species pair', correct: 'A' },

  { level: 6, topic: 'Fossil Evidence', difficulty: 'medium', image: 'diagram://fossil',
    q: 'Fossils help scientists place events in a phylogeny by providing ___.',
    a: 'evidence of when lineages appeared in the past',
    b: 'evidence of weather only',
    c: 'the exact color patterns of ancient animals',
    d: 'records of animal behavior only', correct: 'A' },

  { level: 6, topic: 'Natural Selection', difficulty: 'medium',
    q: 'When two populations of the same species become reproductively isolated, the result can be ___.',
    a: 'speciation (formation of new species)',
    b: 'immediate fossilization',
    c: 'identical offspring forever',
    d: 'loss of DNA', correct: 'A' },

  { level: 6, topic: 'Common Ancestry', difficulty: 'medium', image: 'diagram://tree',
    q: 'In a phylogenetic tree, humans, chimpanzees, and gorillas branch from a shared node. This means they ___.',
    a: 'share a common ancestor that was neither human nor ape',
    b: 'evolved directly from one another',
    c: 'have no relationship',
    d: 'are the same species', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 7 - Cladograms and Classification
  // ------------------------------------------------------------------
  { level: 7, topic: 'Cladograms', difficulty: 'medium', image: 'diagram://cladogram',
    q: 'What do shared derived characters tell us in a cladogram?',
    a: 'They indicate which taxa are more closely related to one another',
    b: 'They indicate the size of each organism',
    c: 'They indicate the habitat of each species',
    d: 'They prove artificial selection', correct: 'A' },

  { level: 7, topic: 'Cladograms', difficulty: 'medium',
    q: 'Why do scientists prefer shared derived characters over overall similarity when building cladograms?',
    a: 'Overall similarity can result from convergent evolution; derived characters better show common descent',
    b: 'Overall similarity is too difficult to measure',
    c: 'Derived characters are found only in fossils',
    d: 'Similarity never occurs in real nature', correct: 'A' },

  { level: 7, topic: 'Cladograms', difficulty: 'hard', image: 'diagram://cladogram',
    q: 'In a cladogram, the taxon that branches off first and shares the fewest derived characters with the rest is called the ___ group.',
    a: 'outgroup', b: 'ingroup', c: 'keystone', d: 'climax', correct: 'A' },

  { level: 7, topic: 'Phylogenetic Trees', difficulty: 'medium',
    q: 'A monophyletic group (clade) is best described as a group that ___.',
    a: 'includes an ancestor and all of its descendants',
    b: 'includes species that look alike',
    c: 'includes only extinct species',
    d: 'excludes the common ancestor', correct: 'A' },

  { level: 7, topic: 'Phylogenetic Trees', difficulty: 'medium',
    q: 'The science of classifying organisms based on their evolutionary history is called ___.',
    a: 'phylogenetics', b: 'meteorology', c: 'crystallography', d: 'hematology', correct: 'A' },

  { level: 7, topic: 'Homologous Structures', difficulty: 'hard',
    q: 'The same gene found with small changes across many different species is called a ___.',
    a: 'homologous gene', b: 'vestigial gene', c: 'analogous enzyme', d: 'fossil gene', correct: 'A' },

  { level: 7, topic: 'Analogous Structures', difficulty: 'medium',
    q: 'Dolphins (mammals) and sharks (fish) both have a streamlined torpedo-like body shape for swimming. Their body shape is ___.',
    a: 'analogous (a result of convergent evolution)',
    b: 'evidence they share a recent ancestor',
    c: 'vestigial',
    d: 'impossible to explain', correct: 'A' },

  { level: 7, topic: 'Vestigial Structures', difficulty: 'medium', image: 'diagram://vestigial',
    q: 'The kiwi, a flightless bird, has very small wing bones. These wings are described as ___.',
    a: 'vestigial structures', b: 'homologous to nothing', c: 'analogous organs', d: 'fresh fossils', correct: 'A' },

  { level: 7, topic: 'Natural Selection', difficulty: 'hard', image: 'diagram://natural-selection',
    q: 'After a drought, average beak size in a finch population increased and large-beaked parents passed the trait to offspring. This illustrates that ___.',
    a: 'natural selection acts on heritable variation',
    b: 'beaks change by individual desire',
    c: 'finches generate new beaks instantly',
    d: 'drought had no effect', correct: 'A' },

  { level: 7, topic: 'Common Ancestry', difficulty: 'medium', image: 'diagram://tree',
    q: 'The "tree of life" illustrates the idea that ___.',
    a: 'all species are connected through common ancestry',
    b: 'each species has a completely independent origin',
    c: 'species never become extinct',
    d: 'evolution stopped long ago', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 8 - Adaptation and Survival
  // ------------------------------------------------------------------
  { level: 8, topic: 'Adaptation and Variation', difficulty: 'easy',
    q: 'Birds that fly to warmer areas during winter are demonstrating the behavioral adaptation called ___.',
    a: 'migration', b: 'hibernation', c: 'metamorphosis', d: 'photosynthesis', correct: 'A' },

  { level: 8, topic: 'Adaptation and Variation', difficulty: 'medium', image: 'diagram://galapagos',
    q: 'The varied beak shapes of Darwin\'s finches most likely arose because of ___.',
    a: 'adaptation to different food sources over generations',
    b: 'a single finch changing its beak in one year',
    c: 'the weather changing their DNA instantly',
    d: 'farmers selectively crossing finches', correct: 'A' },

  { level: 8, topic: 'Adaptation and Variation', difficulty: 'medium',
    q: 'Cacti have spines instead of leaves. This adaptation primarily helps them ___.',
    a: 'reduce water loss', b: 'attract more sunlight', c: 'grow taller quickly', d: 'produce more flowers', correct: 'A' },

  { level: 8, topic: 'Adaptation and Variation', difficulty: 'hard',
    q: 'An organism that can survive and reproduce in many different environments is said to have a ___.',
    a: 'broad ecological niche', b: 'narrow fossil record', c: 'single isolated habitat', d: 'vestigial metabolism', correct: 'A' },

  { level: 8, topic: 'Adaptation and Variation', difficulty: 'medium', image: 'diagram://dna',
    q: 'Sexual reproduction increases genetic variation because offspring ___.',
    a: 'receive a mix of alleles from both parents',
    b: 'are identical clones of the mother',
    c: 'produce no new combinations',
    d: 'do not inherit any genes', correct: 'A' },

  { level: 8, topic: 'Adaptation and Variation', difficulty: 'hard',
    q: 'Which of the following is the original source of all new alleles (gene versions)?',
    a: 'Mutations', b: 'Fossilization', c: 'Predation', d: 'Migration of birds', correct: 'A' },

  { level: 8, topic: 'Natural Selection', difficulty: 'medium', image: 'diagram://peppered',
    q: 'The color change of the peppered moth during the Industrial Revolution demonstrated that ___.',
    a: 'natural selection can change the frequency of traits in a population',
    b: 'moths paint themselves darker',
    c: 'soot enters cells and changes color directly',
    d: 'predators stopped eating moths', correct: 'A' },

  { level: 8, topic: 'Fossil Evidence', difficulty: 'medium', image: 'diagram://fossil',
    q: 'Scientists reconstruct the appearance and behavior of long-extinct organisms mainly using ___.',
    a: 'fossil evidence', b: 'weather records', c: 'leaves of plants', d: 'modern maps', correct: 'A' },

  { level: 8, topic: 'Vestigial Structures', difficulty: 'medium',
    q: 'Human wisdom teeth are sometimes considered vestigial because ___.',
    a: 'they are less needed today because our diet and cooking changed',
    b: 'they never develop in anyone',
    c: 'they are the same as the appendix',
    d: 'they grow only in adults above 60', correct: 'A' },

  { level: 8, topic: 'Common Ancestry', difficulty: 'medium', image: 'diagram://embryo',
    q: 'When two species share many similar genes and similar developmental stages, it strongly suggests they ___.',
    a: 'evolved from a relatively recent common ancestor',
    b: 'evolved completely separately',
    c: 'are identical species',
    d: 'appeared at the same time with no connection', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 9 - Evolution in the Modern World
  // ------------------------------------------------------------------
  { level: 9, topic: 'Natural Selection', difficulty: 'hard',
    q: 'Mosquitoes became resistant to the pesticide DDT after decades of spraying. This happened because ___.',
    a: 'resistance alleles increased in frequency through natural selection',
    b: 'DDT created brand-new resistance genes in every mosquito',
    c: 'mosquitoes learned to avoid the chemical',
    d: 'the chemical changed their DNA multiple times in one generation', correct: 'A' },

  { level: 9, topic: 'Natural Selection', difficulty: 'medium',
    q: 'Why do doctors advise patients to finish a full course of antibiotics?',
    a: 'To reduce the chance that resistant bacteria survive and spread',
    b: 'To make the antibiotics more colorful',
    c: 'To help bacteria grow faster',
    d: 'To prevent the infection from becoming viral', correct: 'A' },

  { level: 9, topic: 'Fossil Evidence', difficulty: 'medium', image: 'diagram://fossil',
    q: 'Transitional fossils such as Tiktaalik provide evidence of ___.',
    a: 'evolution from fish-like ancestors to land vertebrates',
    b: 'the sudden appearance of complex life',
    c: 'species never changing',
    d: 'fossils forming in living tissue', correct: 'A' },

  { level: 9, topic: 'Evidence of Evolution', difficulty: 'medium', image: 'diagram://dna',
    q: 'Scientists use DNA comparisons to trace how viruses spread because ___.',
    a: 'mutations accumulate at a measurable rate (molecular clock)',
    b: 'viruses cannot mutate',
    c: 'DNA tells us the virus color',
    d: 'viruses are not made of genetic material', correct: 'A' },

  { level: 9, topic: 'Evidence of Evolution', difficulty: 'medium',
    q: 'Species X shares 95% of its DNA with species P and only 85% with species Q. Based on this evidence, ___.',
    a: 'species X is more closely related to P than to Q',
    b: 'species X is more closely related to Q than to P',
    c: 'Q and P are the same species',
    d: 'DNA cannot be used for relationships', correct: 'A' },

  { level: 9, topic: 'Evidence of Evolution', difficulty: 'hard', image: 'diagram://embryo',
    q: 'Similar developmental "master control" genes (such as Hox genes) found in both flies and humans indicate ___.',
    a: 'a common ancestor that lived very long ago',
    b: 'that flies evolved from humans',
    c: 'no evolutionary relationship at all',
    d: 'that the genes formed by coincidence in each species', correct: 'A' },

  { level: 9, topic: 'Vestigial Structures', difficulty: 'medium',
    q: 'Some cave-dwelling animals have eyes that cannot see or no eyes at all. Their eyes are considered ___.',
    a: 'vestigial structures', b: 'analogous structures', c: 'fossil fuels', d: 'reproductive organs', correct: 'A' },

  { level: 9, topic: 'Adaptation and Variation', difficulty: 'medium',
    q: 'A camel\'s hump (fat store) and broad feet are adaptations for living in ___.',
    a: 'deserts', b: 'rainforests', c: 'tundra', d: 'coral reefs', correct: 'A' },

  { level: 9, topic: 'Phylogenetic Trees', difficulty: 'hard', image: 'diagram://tree',
    q: 'The closer two species are located on a phylogenetic tree, the more recently ___.',
    a: 'they shared a common ancestor',
    b: 'they became extinct',
    c: 'they developed identical DNA',
    d: 'fossils formed between them', correct: 'A' },

  { level: 9, topic: 'Common Ancestry', difficulty: 'hard',
    q: 'All organisms share the same basic biochemistry - ATP for energy, DNA for heredity, and ribosomes for protein synthesis. This strongly suggests ___.',
    a: 'a single common origin of life',
    b: 'many completely independent origins of life',
    c: 'that biochemistry is irrelevant to evolution',
    d: 'that life started only recently', correct: 'A' },

  // ------------------------------------------------------------------
  // LEVEL 10 - Master of Evolution
  // ------------------------------------------------------------------
  { level: 10, topic: 'Evidence of Evolution', difficulty: 'medium', image: 'diagram://dna',
    q: 'Which modern technique provides the most precise evidence for how closely related two species are?',
    a: 'Comparing their DNA sequences',
    b: 'Just looking at their colors',
    c: 'Counting their limbs only',
    d: 'Observing them for one day', correct: 'A' },

  { level: 10, topic: 'Fossil Evidence', difficulty: 'hard', image: 'diagram://fossil',
    q: 'The popular term "missing link" best refers to ___.',
    a: 'transitional fossil forms that show intermediate traits between major groups',
    b: 'a fossil with no bones',
    c: 'a rock layer without fossils',
    d: 'a species that cannot evolve', correct: 'A' },

  { level: 10, topic: 'Homologous Structures', difficulty: 'medium', image: 'diagram://homologous',
    q: 'The bones in a horse leg, dolphin flipper, and bat wing are homologous because they ___.',
    a: 'share a common evolutionary origin despite different functions',
    b: 'are identical in shape and function',
    c: 'evolved independently with the same function',
    d: 'are all made of cartilage only', correct: 'A' },

  { level: 10, topic: 'Analogous Structures', difficulty: 'medium', image: 'diagram://analogous',
    q: 'The tail fin of a fish and the flukes of a whale have a similar shape for swimming, but they did not come from a common ancestor with that trait. They are ___.',
    a: 'analogous structures', b: 'homologous structures', c: 'vestigial structures', d: 'fossil structures', correct: 'A' },

  { level: 10, topic: 'Natural Selection', difficulty: 'hard', image: 'diagram://peppered',
    q: 'The study of industrial melanism in peppered moths clearly demonstrated natural selection because ___.',
    a: 'researchers measured allele frequency changes of a heritable trait when the environment changed',
    b: 'moths were painted by humans',
    c: 'soot changed the moths\' DNA instantly',
    d: 'birds stopped reproducing', correct: 'A' },

  { level: 10, topic: 'Phylogenetic Trees', difficulty: 'hard', image: 'diagram://tree',
    q: 'When a phylogenetic tree built from DNA data and another built from fossil data independently agree, this ___.',
    a: 'strengthens confidence in the inferred evolutionary relationships',
    b: 'proves the methods are wrong',
    c: 'shows fossils are unnecessary',
    d: 'weakens the evidence for common descent', correct: 'A' },

  { level: 10, topic: 'Cladograms', difficulty: 'hard', image: 'diagram://cladogram',
    q: 'Using a cladogram where A, B, and C share ancestor X, and B and C share an additional recent ancestor Y, which statement is true?',
    a: 'B and C are more closely related to each other than either is to A',
    b: 'A and C are more closely related than B and C',
    c: 'A, B, and C are equally related',
    d: 'B and C share no traits', correct: 'A' },

  { level: 10, topic: 'Common Ancestry', difficulty: 'medium',
    q: 'The universal genetic code shared by all living things is powerful evidence for ___.',
    a: 'a common ancestor for all life',
    b: 'many unrelated origins of life',
    c: 'evolution having stopped',
    d: 'life starting several times without connection', correct: 'A' },

  { level: 10, topic: 'Adaptation and Variation', difficulty: 'medium',
    q: 'The gradual change in the traits of a population over many generations is known as ___.',
    a: 'evolution', b: 'erosion', c: 'weathering', d: 'condensation', correct: 'A' },

  { level: 10, topic: 'Vestigial Structures', difficulty: 'medium',
    q: 'Why do harmless vestigial structures often remain in populations for millions of years?',
    a: 'Natural selection does not remove them because they cause little or no harm and are inherited leftovers',
    b: 'Organisms actively maintain them for decoration',
    c: 'Fossils prevent them from disappearing',
    d: 'They are always deadly and still persist', correct: 'A' },
]