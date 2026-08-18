export type ViserioGuideImage = {
	src: string;
	alt: string;
};

export type ViserioGuideStep = {
	id: string;
	title: string;
	description: string;
	images?: ViserioGuideImage[];
};

const BUCKET_URL =
	"https://vrniyndhfaawwqzcrqng.supabase.co/storage/v1/object/public/viserio_guide";

export const viserioGuideSteps: ViserioGuideStep[] = [
	{
		id: "iniciar-sesion",
		title: "1. Inicia sesión",
		description:
			"Entra en wowutils.com e inicia sesión con tu cuenta de Battle.net.",
		images: [
			{
				src: `${BUCKET_URL}/welcome_1.webp`,
				alt: "Pantalla de inicio de sesión de WowUtils",
			},
		],
	},
	{
		id: "elegir-personaje",
		title: "2. Elige tu personaje",
		description:
			"Selecciona tu personaje principal y pulsa «Done» para continuar.",
		images: [
			{
				src: `${BUCKET_URL}/welcome_2.webp`,
				alt: "Selección de personaje en WowUtils",
			},
		],
	},
	{
		id: "wishlist-bis",
		title: "3. Configura tus BiS en la Wishlist",
		description:
			"En el menú ve a Group Hub → Loot → Wishlist. Marca los 3 iconos de dificultad y elige los objetos que son BiS para tu personaje.",
		images: [
			{
				src: `${BUCKET_URL}/welcome_3.webp`,
				alt: "Navegación a la Wishlist en el Group Hub",
			},
			{
				src: `${BUCKET_URL}/welcome_4.webp`,
				alt: "Selección de BiS por dificultad en la Wishlist",
			},
		],
	},
	{
		id: "bonus-roll",
		title: "4. Prioridad de bonus roll",
		description:
			"Opcional: define la prioridad de bonus roll para cada dificultad.",
		images: [
			{
				src: `${BUCKET_URL}/welcome_5.webp`,
				alt: "Prioridad de bonus roll por dificultad",
			},
		],
	},
];
