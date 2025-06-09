import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white text-white mt-10 py-6">
      <div className="container mx-auto text-center">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} تمامی حقوق محفوظ است.
        </p>
        <nav className="mt-4">
          <ul className="flex justify-center space-x-4">
            <li>
              <Link href="/" className="text-gray-700 hover:underline">
                خانه
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;

