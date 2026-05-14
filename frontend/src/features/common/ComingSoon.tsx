export default function ComingSoon({ title }: { title: string }) {
	return (
		<div className="p-6">
			<div className="rounded-md border bg-white">
				<div className="px-4 py-2 bg-blue-700 text-white rounded-t-md">
					<h3 className="font-semibold">{title}</h3>
				</div>
				<div className="p-6 text-center">
					<p className="text-lg font-medium">Coming soon</p>
					<p className="text-sm text-gray-600 mt-1">This feature is under development.</p>
				</div>
			</div>
		</div>
	)
}

