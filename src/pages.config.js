import Players from './pages/Players';
import Teams from './pages/Teams';
import Assessments from './pages/Assessments';
import TeamDashboard from './pages/TeamDashboard';
import ClubManagement from './pages/ClubManagement';
import CoachManagement from './pages/CoachManagement';
import UserManagement from './pages/UserManagement';
import CoachDashboard from './pages/CoachDashboard';
import Tryouts from './pages/Tryouts';
import EvaluationsNew from './pages/EvaluationsNew';
import FormationView from './pages/FormationView';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerComparison from './pages/PlayerComparison';
import Analytics from './pages/Analytics';
import AdminDataManagement from './pages/AdminDataManagement';
import PlayerRoleAssignment from './pages/PlayerRoleAssignment';
import ClubSettingsAdmin from './pages/ClubSettingsAdmin';
import Availability from './pages/Availability';
import BookCoach from './pages/BookCoach';
import MyBookings from './pages/MyBookings';
import BookingsTable from './pages/BookingsTable';
import Messages from './pages/Messages';
import TeamReports from './pages/TeamReports';
import TeamTryout from './pages/TeamTryout';
import FAQ from './pages/FAQ';
import FitnessResources from './pages/FitnessResources';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import PlayerProgressDashboard from './pages/PlayerProgressDashboard';
import Communications from './pages/Communications';
import TeamRoster from './pages/TeamRoster';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Players": Players,
    "Teams": Teams,
    "Assessments": Assessments,
    "TeamDashboard": TeamDashboard,
    "ClubManagement": ClubManagement,
    "CoachManagement": CoachManagement,
    "UserManagement": UserManagement,
    "CoachDashboard": CoachDashboard,
    "Tryouts": Tryouts,
    "EvaluationsNew": EvaluationsNew,
    "FormationView": FormationView,
    "PlayerDashboard": PlayerDashboard,
    "PlayerComparison": PlayerComparison,
    "Analytics": Analytics,
    "AdminDataManagement": AdminDataManagement,
    "PlayerRoleAssignment": PlayerRoleAssignment,
    "ClubSettingsAdmin": ClubSettingsAdmin,
    "Availability": Availability,
    "BookCoach": BookCoach,
    "MyBookings": MyBookings,
    "BookingsTable": BookingsTable,
    "Messages": Messages,
    "TeamReports": TeamReports,
    "TeamTryout": TeamTryout,
    "FAQ": FAQ,
    "FitnessResources": FitnessResources,
    "AdvancedAnalytics": AdvancedAnalytics,
    "PlayerProgressDashboard": PlayerProgressDashboard,
    "Communications": Communications,
    "TeamRoster": TeamRoster,
}

export const pagesConfig = {
    mainPage: "Messages",
    Pages: PAGES,
    Layout: __Layout,
};