import { Link } from "react-router-dom";
export default function Home() {
    return (
        <div className="">
            <h1>Home - Página de inicio</h1>
            <p>Bienvenido a TaskApp</p>

            <Link to={'/register'}>
                <button>Registro</button>
            </Link>

            <Link to={'/login'}>
                <button>Login</button>
            </Link>
        </div>
    );
}