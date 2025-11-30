import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import BookSession from './pages/BookSession';
import Teams from './pages/Teams';
import Assessments from './pages/Assessments';
import TeamDashboard from './pages/TeamDashboard';
import ClubManagement from './pages/ClubManagement';
import Messages from './pages/Messages';
import UnassignedRecords from './pages/UnassignedRecords';
import CoachManagement from './pages/CoachManagement';
import Availability from './pages/Availability';
import UserManagement from './pages/UserManagement';
import BookingsTable from './pages/BookingsTable';
import CoachDashboard from './pages/CoachDashboard';
import TeamCalendar from './pages/TeamCalendar';
import TeamCommunication from './pages/TeamCommunication';
import TeamDrills from './pages/TeamDrills';
import MyBookings from './pages/MyBookings';
import Tryouts from './pages/Tryouts';
import EvaluationsNew from './pages/EvaluationsNew';
import FormationView from './pages/FormationView';
import TeamTacticalView from './pages/TeamTacticalView';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerComparison from './pages/PlayerComparison';
import Analytics from './pages/Analytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Players": Players,
    "BookSession": BookSession,
    "Teams": Teams,
    "Assessments": Assessments,
    "TeamDashboard": TeamDashboard,
    "ClubManagement": ClubManagement,
    "Messages": Messages,
    "UnassignedRecords": UnassignedRecords,
    "CoachManagement": CoachManagement,
    "Availability": Availability,
    "UserManagement": UserManagement,
    "BookingsTable": BookingsTable,
    "CoachDashboard": CoachDashboard,
    "TeamCalendar": TeamCalendar,
    "TeamCommunication": TeamCommunication,
    "TeamDrills": TeamDrills,
    "MyBookings": MyBookings,
    "Tryouts": Tryouts,
    "EvaluationsNew": EvaluationsNew,
    "FormationView": FormationView,
    "TeamTacticalView": TeamTacticalView,
    "PlayerDashboard": PlayerDashboard,
    "PlayerComparison": PlayerComparison,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "BookSession",
    Pages: PAGES,
    Layout: __Layout,
};