import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Hero section */}
      <section className="flex flex-col md:flex-row items-center justify-between py-12 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="md:w-1/2 mb-12 md:mb-0 md:pr-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            HealthyWorld
          </h1>
          <p className="text-xl mb-6 text-gray-300">
            Track your health, join challenges, and earn rewards with World ID verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/login" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
              </svg>
              Login with World ID
            </Link>
            <a 
              href="https://worldcoin.org/download"
              target="_blank"
              rel="noopener noreferrer" 
              className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,5V11H14.17L12,13.17L9.83,11H11V5H13M15,3H9V9H5L12,16L19,9H15V3M19,18H5V20H19V18Z" />
              </svg>
              Download World App
            </a>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full animate-pulse-slow"></div>
            <div className="relative z-10 flex items-center justify-center h-full">
              <Image 
                src="/logo.svg" 
                alt="HealthyWorld Logo" 
                width={180} 
                height={180} 
                className="rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-12 px-6 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            How HealthyWorld Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Verify Your Identity</h3>
              <p className="text-gray-400">
                Login securely with World ID to protect your identity while verifying you're a unique human.
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22A9,9 0 0,0 21,13A9,9 0 0,0 12,4M12,8A3,3 0 0,0 9,11V13H15V11A3,3 0 0,0 12,8Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Track Your Health</h3>
              <p className="text-gray-400">
                Monitor steps, water intake, sleep, and other metrics to maintain a healthy lifestyle.
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,8L10.67,8.09C9.81,7.07 7.4,4.5 5,4.5C5,4.5 3.03,7.46 4.96,11.41C4.41,12.24 4.07,12.67 4,13.66L2.07,13.95L2.28,14.93L4.04,14.67L4.18,15.38L2.61,16.32L3.08,17.21L4.53,16.32C5.68,18.76 8.59,20 12,20C15.41,20 18.32,18.76 19.47,16.32L20.92,17.21L21.39,16.32L19.82,15.38L19.96,14.67L21.72,14.93L21.93,13.95L20,13.66C19.93,12.67 19.59,12.24 19.04,11.41C20.97,7.46 19,4.5 19,4.5C16.6,4.5 14.19,7.07 13.33,8.09L12,8M9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11M15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11M11,14H13L12.3,15.39C12.5,16.03 13.06,16.5 13.75,16.5A1.5,1.5 0 0,0 15.25,15H15.75A2,2 0 0,1 13.75,17C13,17 12.35,16.59 12,16V16H12C11.65,16.59 11,17 10.25,17A2,2 0 0,1 8.25,15H8.75A1.5,1.5 0 0,0 10.25,16.5C10.94,16.5 11.5,16.03 11.7,15.39L11,14Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Earn Rewards</h3>
              <p className="text-gray-400">
                Complete challenges and build streaks to earn points and unlock special rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="py-12 px-6 bg-black">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-8">
          <div className="flex items-start">
            <svg className="w-12 h-12 text-emerald-500 mr-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C15.4,11 16,11.6 16,12.3V15.8C16,16.4 15.4,17 14.7,17H9.2C8.6,17 8,16.4 8,15.7V12.2C8,11.6 8.6,11 9.2,11V9.5C9.2,8.1 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z" />
            </svg>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-white">Privacy-First Approach</h3>
              <p className="text-gray-300 mb-4">
                HealthyWorld uses World ID to verify your identity without compromising your privacy. 
                We never store your personal information or biometric data.
              </p>
              <a 
                href="https://worldcoin.org/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center"
              >
                Learn more about World ID privacy
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} HealthyWorld. Powered by World ID.
        </p>
      </footer>
    </div>
  )
}
