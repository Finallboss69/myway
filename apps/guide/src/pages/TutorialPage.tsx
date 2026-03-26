import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import TutorialOverlay from "../components/TutorialOverlay";
import { screens } from "../data/screens";
import { roles } from "../data/roles";

// Screen components
import WaiterTablesScreen from "../screens/WaiterTablesScreen";
import {
	WaiterOrderScreen,
	WaiterReadyScreen,
	WaiterPaymentScreen,
	KDSBoardScreen,
	StockScreen,
	POSSalonScreen,
	POSOrdersScreen,
	RepartidorScreen,
	AdminDashboardScreen,
	AdminMenuScreen,
	AdminTablesScreen,
	AdminEmployeesScreen,
	AdminSuppliersScreen,
	AdminExpensesScreen,
	AdminCashScreen,
	AdminAccountingScreen,
	AdminInvoicesScreen,
	AdminMPConfigScreen,
	AdminAFIPConfigScreen,
	AdminDeliveryScreen,
} from "../screens/AllScreens";

const screenComponents: Record<string, React.ReactNode> = {
	"waiter-tables": <WaiterTablesScreen />,
	"waiter-order": <WaiterOrderScreen />,
	"waiter-ready": <WaiterReadyScreen />,
	"waiter-payment": <WaiterPaymentScreen />,
	"kitchen-board": <KDSBoardScreen variant="kitchen" />,
	"kitchen-stock": <StockScreen variant="kitchen" />,
	"bar-board": <KDSBoardScreen variant="bar" />,
	"bar-stock": <StockScreen variant="bar" />,
	"pos-salon": <POSSalonScreen />,
	"pos-orders": <POSOrdersScreen />,
	"repartidor-delivery": <RepartidorScreen />,
	"admin-dashboard": <AdminDashboardScreen />,
	"admin-menu": <AdminMenuScreen />,
	"admin-tables": <AdminTablesScreen />,
	"admin-employees": <AdminEmployeesScreen />,
	"admin-suppliers": <AdminSuppliersScreen />,
	"admin-expenses": <AdminExpensesScreen />,
	"admin-cash": <AdminCashScreen />,
	"admin-accounting": <AdminAccountingScreen />,
	"admin-invoices": <AdminInvoicesScreen />,
	"admin-mercadopago": <AdminMPConfigScreen />,
	"admin-afip": <AdminAFIPConfigScreen />,
	"admin-delivery": <AdminDeliveryScreen />,
};

export default function TutorialPage() {
	const { screenId } = useParams<{ screenId: string }>();
	const screen = screens.find((s) => s.id === screenId);

	if (!screen) {
		return (
			<Layout backTo="/" backLabel="Inicio">
				<p className="text-center py-10 text-[var(--ink-faint)]">
					Tutorial no encontrado
				</p>
			</Layout>
		);
	}

	const role = roles.find((r) => r.id === screen.roleId);
	const component = screenComponents[screen.id];

	return (
		<Layout
			backTo={`/rol/${screen.roleId}`}
			backLabel={role?.name || "Volver"}
			title={screen.name}
		>
			{/* Screen info */}
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-1">
					<code className="bg-white/5 px-2 py-0.5 rounded text-xs text-[var(--ink-faint)]">
						{screen.url}
					</code>
				</div>
				<p className="text-sm text-[var(--ink-secondary)]">
					{screen.description}
				</p>
			</div>

			{/* Simulated screen */}
			<div className="mb-32">{component}</div>

			{/* Tutorial overlay */}
			<TutorialOverlay steps={screen.steps} screenName={screen.name} />
		</Layout>
	);
}
